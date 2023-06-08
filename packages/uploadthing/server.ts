import { createBuilder } from "./src/upload-builder";

export * from "@uploadthing/shared";
export * as utapi from "./src/helper-functions";

export const createUploadthing = () => createBuilder<"web">();
