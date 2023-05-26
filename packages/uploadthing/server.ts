import { createBuilder } from "./src/upload-builder";

export * from "./src/types";

export const createUploadthing = () => createBuilder<"web">();
