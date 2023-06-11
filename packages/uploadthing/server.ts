import { createBuilder } from "./src/upload-builder";

export * from "./src/types";
export * as utapi from "./src/helper-functions";
export { createServerHandler } from "./src/next/core/approuter";

export const createUploadthing = () => createBuilder<"web">();
