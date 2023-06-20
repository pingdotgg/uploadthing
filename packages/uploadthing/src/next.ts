import { createBuilder } from "./internal/upload-builder";

export { createNextRouteHandler } from "./internal/next/approuter";
export type { FileRouter } from "./internal/types";

export const createUploadthing = () => createBuilder<"app">();
