import { createBuilder } from "./src/upload-builder";

export { createNuxtRouteHandler } from "./src/nuxt";
export type { FileRouter } from "./src/internal/types";

export const createUploadthing = () => createBuilder<"nuxt">();