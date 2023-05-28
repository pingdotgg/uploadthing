import { createBuilder } from "./src/upload-builder";

export { createNextPageApiHandler } from "./src/next/core/page";
export type { FileRouter } from "./src/types";

export const createUploadthing = () => createBuilder<"pages">();
