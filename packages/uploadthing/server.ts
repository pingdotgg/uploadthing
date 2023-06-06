import { createBuilder } from "./src/upload-builder";

export * from "@uploadthing/shared/types";
export * as utapi from "./src/helper-functions";

export const createUploadthing = () => createBuilder<"web">();
