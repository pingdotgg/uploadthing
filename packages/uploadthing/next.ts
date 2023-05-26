import { createBuilder } from "./src/upload-builder";

export { createNextRouteHandler } from "./src/next/core/approuter";
export type { FileRouter } from "./src/types";

export const createUploadthing = () => createBuilder<"app">();
