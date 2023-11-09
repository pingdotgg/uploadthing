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

// Module options TypeScript interface definition
export interface ModuleOptions {
  routerPath: string;
}

export default defineNuxtModule<ModuleOptions>({
  meta: {
    name: "nuxt-uploadthing",
    configKey: "uploadthing",
    compatibility: {
      nuxt: "^3.0.0",
    },
  },
  defaults: {
    routerPath: "~/server/uploadthing.ts",
  },
  async setup(options, nuxt) {
    const logger = useLogger("uploadthing");
    const resolver = createResolver(import.meta.url);

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
      export: "UploadButton",
      filePath: "@uploadthing/vue",
    });
    addComponent({
      name: "UploadDropzone",
      export: "UploadDropzone",
      filePath: "@uploadthing/vue",
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
