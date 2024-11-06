import type { ActionFunctionArgs } from "@remix-run/server-runtime";
import * as Effect from "effect/Effect";

import type { Json } from "@uploadthing/shared";

import { makeAdapterHandler } from "./internal/handler";
import type { CreateBuilderOptions } from "./internal/upload-builder";
import { createBuilder } from "./internal/upload-builder";
import type { FileRouter, RouteHandlerOptions } from "./types";

export type { FileRouter };
export { UTFiles } from "./internal/types";

type AdapterArgs = {
  req: undefined;
  res: undefined;
  event: ActionFunctionArgs;
};

export const createUploadthing = <TErrorShape extends Json>(
  opts?: CreateBuilderOptions<TErrorShape>,
) => createBuilder<AdapterArgs, TErrorShape>(opts);

export const createRouteHandler = <TRouter extends FileRouter>(
  opts: RouteHandlerOptions<TRouter>,
) => {
  const handler = makeAdapterHandler<[ActionFunctionArgs]>(
    (args) => Effect.succeed({ req: undefined, res: undefined, event: args }),
    (args) => Effect.succeed(args.request),
    opts,
    "remix",
  );
  return { action: handler, loader: handler };
};
