import { createBuilder } from "./src/upload-builder";

export type { FileRouter } from "./src/internal/types";

export const createUploadthing = () => createBuilder<"web">();
