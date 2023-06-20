import { createBuilder } from "./internal/upload-builder";

export * from "./internal/types";
export * as utapi from "./sdk";
export { createServerHandler } from "./internal/edge";

export const createUploadthing = () => createBuilder<"web">();
