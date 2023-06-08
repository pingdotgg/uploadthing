import { createBuilder } from "./src/upload-builder";

export * from "./src/internal/types";

export const createUploadthing = () => createBuilder<"web">();
