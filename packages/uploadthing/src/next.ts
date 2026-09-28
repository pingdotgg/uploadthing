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
   * On Next.js 15.1 or later, the task is handed to `after` while the request
   * is still open. `onUploadComplete` can return `serverData` without awaiting
   * the task, and Next.js keeps the invocation alive until the task settles.
   * Earlier versions start the task and warn once. In development, callback
   * hooks run after the response, so those tasks start in-process.
   */
  waitUntil: (task: AfterTask) => void;
};

let didWarnMissingAfter = false;

const warnTaskMayFreeze = (): void => {
  if (didWarnMissingAfter) return;
  didWarnMissingAfter = true;
  // eslint-disable-next-line no-console
  console.warn(
    "[uploadthing] ctx.waitUntil could not register with Next.js after. The task was started, but a serverless function may freeze it when the response ends. Requires Next.js 15.1 or later for the task to outlive the response.",
  );
};

/** Failures stay off the upload hook, including when `after` runs the task. */
const settleTask = (task: AfterTask): Promise<void> => {
  try {
    const pending = typeof task === "function" ? task() : task;
    return Promise.resolve(pending).then(
      () => undefined,
      (error: unknown) => {
        // eslint-disable-next-line no-console
        console.error("[uploadthing] ctx.waitUntil task failed.", error);
      },
    );
  } catch (error) {
    // eslint-disable-next-line no-console
    console.error("[uploadthing] ctx.waitUntil task failed.", error);
    return Promise.resolve();
  }
};

type RequestScheduler = {
  enqueue: (task: AfterTask) => void;
};

/**
 * `after` reads the request store at call time. Hooks run later, sometimes
 * after that store is gone, so the queue is opened here and hooks only enqueue.
 */
const openScheduler = (): RequestScheduler => {
  const tasks: Array<AfterTask> = [];
  let sealed = false;
  let failed = false;

  const flush = (): Promise<void> => {
    sealed = true;
    const batch = tasks.splice(0, tasks.length);
    return Promise.all(batch.map(settleTask)).then(() => undefined);
  };

  if (typeof NextServer.after === "function") {
    try {
      NextServer.after(flush);
    } catch {
      // Thrown before registration. Leave `flush` uncalled so the task runs once.
      failed = true;
      sealed = true;
    }
  } else {
    failed = true;
    sealed = true;
  }

  return {
    enqueue(task) {
      if (failed) {
        warnTaskMayFreeze();
        void settleTask(task);
        return;
      }
      if (sealed) {
        // Development detaches callback hooks after the response. `after`
        // already ran, and the dev server still finishes the task.
        void settleTask(task);
        return;
      }
      tasks.push(task);
    },
  };
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
    (req) => {
      // Built eagerly, while the route handler still holds the request scope.
      const scheduler = req.method === "POST" ? openScheduler() : undefined;
      return Effect.succeed({
        req,
        ctx: {
          waitUntil: (task) => {
            if (scheduler) scheduler.enqueue(task);
            else void settleTask(task);
          },
        },
      });
    },
    (req) => Effect.succeed(req),
    opts,
    "nextjs-app",
  );
  return { POST: handler, GET: handler };
};
