import { HttpClient, HttpClientRequest } from "@effect/platform";
import * as Context from "effect/Context";
import * as Effect from "effect/Effect";
import * as Layer from "effect/Layer";

import { FetchContext } from "@uploadthing/shared";

export class UploadThingClient
  extends /** #__PURE__ */ Context.Tag("uploadthing/UploadThingClient")<
    UploadThingClient,
    HttpClient.HttpClient.Default
  >() {}

const mkClient = Effect.gen(function* () {
  const client = yield* HttpClient.HttpClient;
  HttpClient.fetch;
  const { baseHeaders } = yield* FetchContext;

  return client.pipe(
    HttpClient.mapRequest(HttpClientRequest.setHeaders(baseHeaders)),
  );
});

export const httpClientLayer = Layer.effect(UploadThingClient, mkClient).pipe(
  Layer.provide(HttpClient.layer),
  Layer.provide(
    Layer.effect(
      HttpClient.Fetch,
      Effect.map(FetchContext, (_) => _.fetch as typeof globalThis.fetch),
    ),
  ),
);
