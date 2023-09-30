import {
  addComponent,
  addImports,
  addServerHandler,
  createResolver,
  defineNuxtModule,
} from "@nuxt/kit";

import { FileRouter } from "uploadthing/h3";

// Module options TypeScript interface definition
export interface ModuleOptions<TRouter extends FileRouter> {
  // QQ: How do we make this generic from the module??
  router: TRouter;
}

export default defineNuxtModule<ModuleOptions<FileRouter>>({
  meta: {
    name: "nuxt-uploadthing",
    configKey: "uploadthing",
    compatibility: {
      nuxt: "^3.0.0",
    },
  },
  setup(options, nuxt) {
    const { resolve } = createResolver(import.meta.url);
    nuxt.options.runtimeConfig.public.uploadRouter = options.router;

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
      from: resolve("./runtime/composables/useUploadThing"),
    });

    addServerHandler({
      route: "/api/uploadthing",
      handler: resolve("./runtime/server/api/uploadthing"),
    });
  },
});
