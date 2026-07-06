import * as ConfigProvider from "effect/ConfigProvider";
import * as Effect from "effect/Effect";
import * as Layer from "effect/Layer";
import * as ManagedRuntime from "effect/ManagedRuntime";
import * as FetchHttpClient from "effect/unstable/http/FetchHttpClient";
import * as Headers from "effect/unstable/http/Headers";

import type { FetchEsque } from "@uploadthing/shared";

import { configProvider } from "./config";
import { withLogFormat, withMinimalLogLevel } from "./logger";

export const makeRuntime = (fetch: FetchEsque | undefined, config: unknown) => {
  const fetchHttpClient = Layer.provideMerge(
    FetchHttpClient.layer,
    Layer.succeed(
      FetchHttpClient.Fetch,
      // The `Fetch` reference defaults to `globalThis.fetch`, but resolve it
      // lazily so runtime-patched implementations (e.g. msw) are picked up.
      (fetch as typeof globalThis.fetch) ??
        ((...args) => globalThis.fetch(...args)),
    ),
  );

  const withRedactedHeaders = Layer.effect(
    Headers.CurrentRedactedNames,
    Effect.map(Headers.CurrentRedactedNames, (names) =>
      names.concat(["x-uploadthing-api-key"]),
    ),
  );

  /**
   * In Effect v4, the config provider (like all `Context.Reference`s) lives in
   * the context instead of in fiber refs, so it must be merged into the
   * runtime's context for per-request effects to see it.
   */
  const layer = Layer.provideMerge(
    Layer.mergeAll(
      withLogFormat,
      withMinimalLogLevel,
      fetchHttpClient,
      withRedactedHeaders,
    ),
    ConfigProvider.layer(configProvider(config)),
  );
  return ManagedRuntime.make(layer);
};
