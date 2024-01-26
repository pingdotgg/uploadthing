import { createUploadthing } from "uploadthing/h3";
import type { FileRouter } from "uploadthing/h3";

const f = createUploadthing();

export const uploadRouter = {} satisfies FileRouter;

export type UploadRouter = typeof uploadRouter;
