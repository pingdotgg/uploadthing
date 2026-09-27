import * as NextServer from "next/server";
import type { NextRequest } from "next/server";
import * as Effect from "effect/Effect";

import type { Json } from "@uploadthing/shared";

import { makeAdapterHandler } from "./_internal/handler";
import type { CreateBuilderOptions } from "./_internal/upload-builder";
import { createBuilder } from "./_internal/upload-builder";
import type { FileRouter, RouteHandlerOptions } from "./types";

export type { FileRouter };
export {
  UTFiles,
  /**
   * This is an experimental feature.
   * You need to be feature flagged on our backend to use this
   */
  UTRegion as experimental_UTRegion,
} from "./_internal/types";

type AfterTask = Promise<unknown> | (() => unknown);

/**
 * Request helpers for the Next.js App Router adapter.
 * Passed to `middleware`, `onUploadComplete`, and `onUploadError`.
 */
export type RequestContext = {
  /**
   * Schedule work that should not delay the client callback.
   *
   * The task is handed to Next.js `after`. `onUploadComplete` can return
   * `serverData` without awaiting the task, and Next.js keeps the invocation
   * alive until the task settles. Requires Next.js 15.
   */
  waitUntil: (task: AfterTask) => void;
};

let didWarnMissingAfter = false;

const scheduleAfterResponse = (task: AfterTask): void => {
  const after = (NextServer as { after?: (task: AfterTask) => void }).after;
  if (typeof after === "function") {
    after(task);
    return;
  }

  if (!didWarnMissingAfter) {
    didWarnMissingAfter = true;
    // eslint-disable-next-line no-console
    console.warn(
      "[uploadthing] ctx.waitUntil needs Next.js 15. The task was started, but a serverless function may freeze it when the response ends.",
    );
  }

  void Promise.resolve(typeof task === "function" ? task() : task);
};

type AdapterArgs = {
  req: NextRequest;
  ctx: RequestContext;
};

export const createUploadthing = <TErrorShape extends Json>(
  opts?: CreateBuilderOptions<TErrorShape>,
) => createBuilder<AdapterArgs, TErrorShape>(opts);

export const createRouteHandler = <TRouter extends FileRouter>(
  opts: RouteHandlerOptions<TRouter>,
) => {
  const handler = makeAdapterHandler<[NextRequest], AdapterArgs>(
    (req) =>
      Effect.succeed({
        req,
        ctx: { waitUntil: scheduleAfterResponse },
      }),
    (req) => Effect.succeed(req),
    opts,
    "nextjs-app",
  );
  return { POST: handler, GET: handler };
};
