import {
  HttpClient,
  HttpClientRequest,
  HttpClientResponse,
} from "@effect/platform";
import type { Schema } from "effect";
import { Effect, Redacted } from "effect";

import { ApiUrl, UPLOADTHING_VERSION, UTToken } from "../_internal/config";
import { logHttpClientError, logHttpClientResponse } from "../_internal/logger";

export const makeUploadThingApiRequest = Effect.fn("requestUploadThing")(
  function* <TInput, TOutput, TTransformedOutput>(
    pathname: `/${string}`,
    body: TInput,
    responseSchema: Schema.Schema<TTransformedOutput, TOutput>,
  ) {
    const { apiKey } = yield* UTToken;
    const baseUrl = yield* ApiUrl;
    const httpClient = (yield* HttpClient.HttpClient).pipe(
      HttpClient.filterStatusOk,
    );

    yield* Effect.annotateCurrentSpan("baseUrl", baseUrl);
    yield* Effect.annotateCurrentSpan("pathname", pathname);
    yield* Effect.annotateCurrentSpan("input", body);

    const output = yield* HttpClientRequest.post(pathname).pipe(
      HttpClientRequest.prependUrl(baseUrl),
      HttpClientRequest.bodyUnsafeJson(body),
      HttpClientRequest.setHeaders({
        "x-uploadthing-version": UPLOADTHING_VERSION,
        "x-uploadthing-be-adapter": "server-sdk",
        "x-uploadthing-api-key": Redacted.value(apiKey),
      }),
      httpClient.execute,
      Effect.tapBoth({
        onSuccess: logHttpClientResponse("UploadThing API Response"),
        onFailure: logHttpClientError("Failed to request UploadThing API"),
      }),
      Effect.flatMap(HttpClientResponse.schemaBodyJson(responseSchema)),
      Effect.scoped,
    );

    yield* Effect.annotateCurrentSpan("output", output);

    return output;
  },
  Effect.catchTags({
    // TODO: HANDLE THESE PROPERLY
    ConfigError: (e) => Effect.die(e),
    RequestError: (e) => Effect.die(e),
    ResponseError: (e) => Effect.die(e),
    ParseError: (e) => Effect.die(e),
  }),
);
