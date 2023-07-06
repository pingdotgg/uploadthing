import { createBuilder } from "./internal/upload-builder";

export { createNuxtRouteHandler } from "./internal/nuxt";
export type { FileRouter } from "./internal/types";

export const createUploadthing = () => createBuilder<"nuxt">();
