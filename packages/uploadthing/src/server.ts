import { createBuilder } from "./internal/upload-builder";

export * from "./internal/types";
export * as utapi from "./sdk";

export const createUploadthing = () => createBuilder<"web">();
