import type { NextApiRequest, NextApiResponse } from "next";
import * as Effect from "effect/Effect";

import type { Json } from "@uploadthing/shared";

import { makeAdapterHandler } from "./_internal/handler";
import { toWebRequest } from "./_internal/to-web-request";
import type { CreateBuilderOptions } from "./_internal/upload-builder";
import { createBuilder } from "./_internal/upload-builder";
import type { FileRouter, RouteHandlerOptions } from "./types";

export { UTFiles } from "./_internal/types";
export type { FileRouter };

type AdapterArgs = {
  req: NextApiRequest;
  res: NextApiResponse;
};

export const createUploadthing = <TErrorShape extends Json>(
  opts?: CreateBuilderOptions<TErrorShape>,
) => createBuilder<AdapterArgs, TErrorShape>(opts);

export const createRouteHandler = <TRouter extends FileRouter>(
  opts: RouteHandlerOptions<TRouter>,
) => {
  const handler = makeAdapterHandler<
    [NextApiRequest, NextApiResponse],
    AdapterArgs
  >(
    (req, res) => Effect.succeed({ req, res }),
    (req) => toWebRequest(req),
    opts,
    "nextjs-pages",
  );

  return async (req: NextApiRequest, res: NextApiResponse) => {
    const response = await handler(req, res);
    res.status(response.status);
    for (const [name, value] of response.headers) {
      res.setHeader(name, value);
    }
    // FIXME: Should be able to just forward it instead of consuming it first
    return res.json(await response.json());
  };
};
