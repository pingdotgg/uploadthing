import { DevTools } from "@effect/experimental";
import { FetchHttpClient, Headers } from "@effect/platform";
import { NodeSocket } from "@effect/platform-node";
import * as FiberRef from "effect/FiberRef";
import * as Layer from "effect/Layer";
import * as ManagedRuntime from "effect/ManagedRuntime";

import type { FetchEsque } from "@uploadthing/shared";

import { configProvider } from "./config";
import { withLogFormat, withMinimalLogLevel } from "./logger";

export const makeRuntime = (fetch: FetchEsque, config: unknown) => {
  const fetchHttpClient = Layer.provideMerge(
    FetchHttpClient.layer,
    Layer.succeed(FetchHttpClient.Fetch, fetch as typeof globalThis.fetch),
  );

  const withRedactedHeaders = Layer.effectDiscard(
    FiberRef.update(Headers.currentRedactedNames, (_) =>
      _.concat(["x-uploadthing-api-key"]),
    ),
  );

  const DevToolsLive = DevTools.layerSocket.pipe(
    Layer.provide(NodeSocket.layerNet({ port: 34437 })),
  );

  const layer = Layer.provide(
    Layer.mergeAll(
      withLogFormat,
      withMinimalLogLevel,
      fetchHttpClient,
      withRedactedHeaders,
      DevToolsLive,
    ),
    Layer.setConfigProvider(configProvider(config)),
  );
  return ManagedRuntime.make(layer);
};
