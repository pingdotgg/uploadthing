import { FetchHttpClient } from "@effect/platform";
import * as Layer from "effect/Layer";
import * as ManagedRuntime from "effect/ManagedRuntime";

import type { FetchEsque } from "@uploadthing/shared";

import type { UTApiOptions } from "../types";
import { configProvider } from "./config";
import { withLogFormat, withMinimalLogLevel } from "./logger";

export const makeRuntime = (fetch: FetchEsque, opts?: UTApiOptions) => {
  const fetchHttpClient = Layer.provideMerge(
    FetchHttpClient.layer,
    Layer.succeed(FetchHttpClient.Fetch, fetch as typeof globalThis.fetch),
  );
  const layer = Layer.provide(
    Layer.mergeAll(withLogFormat, withMinimalLogLevel, fetchHttpClient),
    Layer.setConfigProvider(configProvider(opts)),
  );
  return ManagedRuntime.make(layer);
};
