import type { Json } from "@uploadthing/shared";

import type { CreateBuilderOptions } from "./internal/upload-builder";
import { createBuilder } from "./internal/upload-builder";

export { createAstroRouteHandler } from "./internal/astro";
export type { FileRouter } from "./internal/types";

export const createUploadthing = <TErrorShape extends Json>(
    opts?: CreateBuilderOptions<TErrorShape>,
) => createBuilder<"app", TErrorShape>(opts);
