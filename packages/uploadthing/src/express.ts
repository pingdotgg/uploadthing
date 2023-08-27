import type { Json } from "@uploadthing/shared";

import type { CreateBuilderOptions } from "./internal/upload-builder";
import { createBuilder } from "./internal/upload-builder";

export { createUploadthingExpressHandler } from "./internal/express";
export type { FileRouter } from "./internal/types";

export const createUploadthing = <TErrorShape extends Json>(
  opts?: CreateBuilderOptions<TErrorShape>,
) => createBuilder<"express", TErrorShape>(opts);
