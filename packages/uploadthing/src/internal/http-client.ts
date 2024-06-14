import * as HttpClient from "@effect/platform/Http/Client";
import * as ClientRequest from "@effect/platform/Http/ClientRequest";
import * as Context from "effect/Context";
import * as Effect from "effect/Effect";
import * as Layer from "effect/Layer";

import { FetchContext } from "@uploadthing/shared";

export class UploadThingClient
  extends /** #__PURE__ */ Context.Tag("uploadthing/UploadThingClient")<
    UploadThingClient,
    HttpClient.Client.Default
  >() {}

const mkClient = Effect.gen(function* () {
  const client = yield* HttpClient.Client;
  HttpClient.fetch;
  const { baseHeaders } = yield* FetchContext;

  return client.pipe(
    HttpClient.mapRequest(ClientRequest.setHeaders(baseHeaders)),
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
