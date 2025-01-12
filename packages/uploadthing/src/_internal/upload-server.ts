import { HttpClient, HttpClientRequest } from "@effect/platform";
import type { Stream } from "effect";
import * as Effect from "effect/Effect";
import { unsafeCoerce } from "effect/Function";

import { UploadThingError } from "@uploadthing/shared";

import { version } from "../../package.json";
import { logHttpClientError } from "./logger";
import type { UploadPutResult } from "./types";

export const uploadWithoutProgress = (
  stream: Stream.Stream<Uint8Array, unknown>,
  presigned: { key: string; url: string },
) =>
  Effect.gen(function* () {
    const httpClient = (yield* HttpClient.HttpClient).pipe(
      HttpClient.filterStatusOk,
    );
    const json = yield* HttpClientRequest.put(presigned.url).pipe(
      HttpClientRequest.bodyStream(stream),
      HttpClientRequest.setHeader("Range", "bytes=0-"),
      HttpClientRequest.setHeader("x-uploadthing-version", version),
      httpClient.execute,
      Effect.tapError(logHttpClientError("Failed to upload file")),
      Effect.mapError(
        (e) =>
          new UploadThingError({
            code: "UPLOAD_FAILED",
            message: "Failed to upload file",
            cause: e,
          }),
      ),
      Effect.andThen((_) => _.json),
      Effect.andThen(unsafeCoerce<unknown, UploadPutResult>),
      Effect.scoped,
    );

    yield* Effect.logDebug(`File ${presigned.key} uploaded successfully`).pipe(
      Effect.annotateLogs("json", json),
    );
    return json;
  });
