import { createBuilder } from "./src/upload-builder";

export * from "./src/types";
export * as utapi from "./src/helper-functions";

export const createUploadthing = () => createBuilder<"web">();
