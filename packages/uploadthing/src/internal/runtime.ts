import { FetchHttpClient } from "@effect/platform";
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
  const layer = Layer.provide(
    Layer.mergeAll(withLogFormat, withMinimalLogLevel, fetchHttpClient),
    Layer.setConfigProvider(configProvider(config)),
  );
  return ManagedRuntime.make(layer);
};
