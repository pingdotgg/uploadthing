import { createBuilder } from "./internal/upload-builder";

export { createNextPageApiHandler } from "./internal/next/pagerouter";
export type { FileRouter } from "./internal/types";

export const createUploadthing = () => createBuilder<"pages">();
