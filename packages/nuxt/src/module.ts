import { existsSync } from "node:fs";
import { resolve } from "node:path";
import {
  addComponent,
  addImports,
  addServerHandler,
  createResolver,
  defineNuxtModule,
  resolvePath,
  useLogger,
} from "@nuxt/kit";
import defu from "defu";

import type { createH3EventHandler } from "uploadthing/h3";

type HandlerConfig = Omit<
  NonNullable<Parameters<typeof createH3EventHandler>[0]["config"]>,
  "uploadthingSecret" | "uploadthingId"
>;

// Module options TypeScript interface definition
export type ModuleOptions = HandlerConfig & {
  routerPath: string;
  secret?: string;
  appId?: string;
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
  },
  async setup(options, nuxt) {
    const logger = useLogger("uploadthing");
    const resolver = createResolver(import.meta.url);

    nuxt.options.runtimeConfig.uploadthing = defu(
      nuxt.options.runtimeConfig.uploadthing as any,
      {
        secret: options.secret,
        appId: options.appId,
        logLevel: options.logLevel,
      },
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
        nuxt.hooks.callHook("restart", { hard: true });
      }
    });

    addComponent({
      name: "UploadButton",
      filePath: resolver.resolve("./runtime/components/button"),
    });
    addComponent({
      name: "UploadDropzone",
      filePath: resolver.resolve("./runtime/components/dropzone"),
    });
    // FIXME: Use Tailwind Wrapper if the user has Tailwind installed
    nuxt.options.css.push("@uploadthing/vue/styles.css");

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
