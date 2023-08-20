import type { Json } from "./shared";

import type { CreateBuilderOptions } from "./internal/upload-builder";
import { createBuilder } from "./internal/upload-builder";

export { createNextRouteHandler } from "./internal/next/approuter";
export type { FileRouter } from "./internal/types";

export const createUploadthing = <TErrorShape extends Json>(
  opts?: CreateBuilderOptions<TErrorShape>,
) => createBuilder<"app", TErrorShape>(opts);
