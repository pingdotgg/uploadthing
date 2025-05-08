import { HttpRouter, HttpServerRequest } from "@effect/platform";
import * as Effect from "effect/Effect";
import * as Layer from "effect/Layer";

import type { Json } from "@uploadthing/shared";

import { configProvider } from "./_internal/config";
import { AdapterArguments, createRequestHandler } from "./_internal/handler";
import type { CreateBuilderOptions } from "./_internal/upload-builder";
import { createBuilder } from "./_internal/upload-builder";
import type { FileRouter, RouteHandlerConfig } from "./types";

export {
  UTFiles,
  /**
   * This is an experimental feature.
   * You need to be feature flagged on our backend to use this
   */
  UTRegion as experimental_UTRegion,
} from "./_internal/types";
export type { FileRouter };

type AdapterArgs = {
  req: HttpServerRequest.HttpServerRequest;
};

export const createUploadthing = <TErrorShape extends Json>(
  opts?: CreateBuilderOptions<TErrorShape>,
) => createBuilder<AdapterArgs, TErrorShape>(opts);

export const createRouteHandler = <TRouter extends FileRouter>(opts: {
  router: TRouter;
  /**
   * @remarks In order to obey by Effect conventions, we have omitted the `config.fetch` and `config.logLevel` options.
   * You can provide these layers on your own if you need to.
   *
   * @example
   * ```ts
   * import { Effect, Layer, Logger, LogLevel } from "effect";
   * import { HttpClient } from "@effect/platform";

   * // Set logLevel
   * Logger.withMinimumLogLevel(LogLevel.Debug)
   *   
   * // Override fetch implementation
   * Layer.succeed(
   *   HttpClient.Fetch,
   *   myFetchImplementation,
   * );
   * ```
   */
  config?: Omit<RouteHandlerConfig, "fetch" | "logLevel">;
}) => {
  const router = Effect.runSync(
    createRequestHandler<TRouter>(opts, "effect-platform"),
  );

  return HttpRouter.provideServiceEffect(
    router,
    AdapterArguments,
    Effect.map(
      HttpServerRequest.HttpServerRequest,
      (serverRequest) =>
        ({
          req: serverRequest,
        }) satisfies AdapterArgs,
    ),
  ).pipe(Effect.provide(Layer.setConfigProvider(configProvider(opts.config))));
};
