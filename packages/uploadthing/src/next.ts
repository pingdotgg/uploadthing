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

/**
 * A promise is already running, so its rejection handler is attached now.
 * A callback stays deferred until it is run.
 */
const deferTask = (task: AfterTask): (() => Promise<void>) => {
  if (typeof task === "function") return () => settleTask(task);
  const settled = settleTask(task);
  return () => settled;
};

type Scheduler = { enqueue: (task: AfterTask) => void };

type SchedulerState = "queueing" | "flushed" | "unregistered";

const inProcess: Scheduler = {
  enqueue: (task) => void deferTask(task)(),
};

/**
 * `after` reads the request store at call time. Hooks run later, sometimes
 * after that store is gone, so `after` is registered here and hooks enqueue.
 */
const openScheduler = (): Scheduler => {
  const queue: Array<() => Promise<void>> = [];
  let state: SchedulerState = "queueing";

  const flush = (): Promise<void> => {
    const batch = queue.splice(0);
    if (batch.length === 0) {
      state = "flushed";
      return Promise.resolve();
    }
    return Promise.all(batch.map((run) => run())).then(flush);
  };

  if (typeof NextServer.after === "function") {
    try {
      NextServer.after(flush);
    } catch {
      // Thrown before registration, so `flush` never runs.
      state = "unregistered";
    }
  } else {
    state = "unregistered";
  }

  const byState: Record<SchedulerState, (run: () => Promise<void>) => void> = {
    queueing: (run) => void queue.push(run),
    // Development detaches callback hooks past the response, and the dev
    // server still finishes the task.
    flushed: (run) => void run(),
    unregistered: (run) => {
      warnTaskMayFreeze();
      void run();
    },
  };

  return { enqueue: (task) => byState[state](deferTask(task)) };
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
      const scheduler = req.method === "POST" ? openScheduler() : inProcess;
      return Effect.succeed({ req, ctx: { waitUntil: scheduler.enqueue } });
    },
    (req) => Effect.succeed(req),
    opts,
    "nextjs-app",
  );
  return { POST: handler, GET: handler };
};
