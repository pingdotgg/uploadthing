import type { Json } from "@uploadthing/shared";

import { buildPermissionsInfoHandler } from "./internal/handler";
import type { FileRouter } from "./internal/types";
import type { CreateBuilderOptions } from "./internal/upload-builder";
import { createBuilder } from "./internal/upload-builder";

export * from "./internal/types";
export * as utapi from "./sdk";
export { createServerHandler } from "./internal/edge";

export const createUploadthing = <TErrorShape extends Json>(
  opts?: CreateBuilderOptions<TErrorShape>,
) => createBuilder<"web", TErrorShape>(opts);

export const shapeRouteConfig = (router: FileRouter) =>
  buildPermissionsInfoHandler({ router })();
