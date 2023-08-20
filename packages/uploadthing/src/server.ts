import type { CreateBuilderOptions } from "./internal/upload-builder";
import { createBuilder } from "./internal/upload-builder";
import type { Json } from "./shared";

export * from "./internal/types";
export * as utapi from "./sdk";
export { createServerHandler } from "./internal/edge";

export const createUploadthing = <TErrorShape extends Json>(
  opts?: CreateBuilderOptions<TErrorShape>,
) => createBuilder<"web", TErrorShape>(opts);
