import { existsSync } from "node:fs";
import { dirname, resolve, sep } from "node:path";
import {
  addComponent,
  addImports,
  addServerHandler,
  addTemplate,
  createResolver,
  defineNuxtModule,
  hasNuxtModule,
  resolvePath,
  useLogger,
} from "@nuxt/kit";
import type { Resolver } from "@nuxt/kit";
import type { Nuxt } from "@nuxt/schema";
import defu from "defu";

import type { RouteHandlerConfig } from "uploadthing/internal/types";

// Module options TypeScript interface definition
export type ModuleOptions = RouteHandlerConfig & {
  routerPath: string;
  /**
   * Injects UploadThing styles into the page
   * If you're using Tailwind, it will inject the
   * UploadThing Tailwind plugin instead.
   *
   * @default true
   */
  injectStyles: boolean;
};

export default defineNuxtModule<ModuleOptions>({
  meta: {
    name: "@uploadthing/nuxt",
    configKey: "uploadthing",
    compatibility: {
      nuxt: "^3.0.0",
    },
  },
  defaults: {
    routerPath: "~/server/uploadthing",
    injectStyles: true,
  },
  async setup(options, nuxt) {
    const logger = useLogger("uploadthing");
    const resolver = createResolver(import.meta.url);

    nuxt.options.runtimeConfig.uploadthing = defu(
      nuxt.options.runtimeConfig.uploadthing as any,
      options,
    );

    // Set path to router
    const routerPath = await resolvePath(options.routerPath);
    nuxt.options.alias["#uploadthing-router"] = routerPath;
    if (!existsSync(routerPath)) {
      logger.warn(
        `To use uploadthing, please create a router file at \`${options.routerPath}\`.`,
      );
      // Default 'empty' router for typing `useUploadThing`
      nuxt.options.alias["#uploadthing-router"] = resolver.resolve(
        "./runtime/server/router",
      );
    }

    // Restart when router file is added or removed
    nuxt.hook("builder:watch", (event, path) => {
      if (event !== "add" && event !== "unlink") {
        return;
      }
      path = resolve(nuxt.options.srcDir, path);
      if (path === routerPath || path.startsWith(routerPath)) {
        void nuxt.hooks.callHook("restart", { hard: true });
      }
    });

    await addComponent({
      name: "UploadButton",
      filePath: resolver.resolve("./runtime/components/button"),
    });
    await addComponent({
      name: "UploadDropzone",
      filePath: resolver.resolve("./runtime/components/dropzone"),
    });

    if (options.injectStyles === true) {
      await injectStyles(options, nuxt, resolver);
    }

    addImports({
      name: "useUploadThing",
      as: "useUploadThing",
      from: resolver.resolve("./runtime/composables/useUploadThing"),
    });

    addServerHandler({
      route: "/api/uploadthing",
      handler: resolver.resolve("./runtime/server/api/uploadthing"),
    });
  },
});

async function injectStyles(
  moduleOptions: ModuleOptions,
  nuxt: Nuxt,
  resolver: Resolver,
) {
  /**
   * Inject UploadThing stylesheet if no Tailwind is installed
   */
  if (!hasNuxtModule("@nuxtjs/tailwindcss", nuxt)) {
    nuxt.options.css.push("@uploadthing/vue/styles.css");
  }

  /**
   * Else we install our tailwind plugin
   */

  const vueDist = await resolver.resolvePath("@uploadthing/vue");
  const contentPath = dirname(vueDist) + sep + "**";

  const template = addTemplate({
    filename: "uploadthing.tailwind.config.cjs",
    write: true,
    getContents: () => `
      const { uploadthingPlugin } = require('uploadthing/tw');

      module.exports = {
        content: [
          ${JSON.stringify(contentPath)}
        ],
        plugins: [
          require('uploadthing/tw').uploadthingPlugin
        ]
      }
    `,
  });

  // @ts-expect-error - Help pls
  const twModuleOptions = (nuxt.options.tailwindcss ??= {}) as {
    configPath?: string | string[];
  };
  if (typeof twModuleOptions.configPath === "string") {
    twModuleOptions.configPath = [twModuleOptions.configPath, template.dst];
  } else if (Array.isArray(twModuleOptions.configPath)) {
    twModuleOptions.configPath.push(template.dst);
  } else {
    twModuleOptions.configPath = template.dst;
  }
}
