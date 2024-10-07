import {
  HttpClient,
  HttpClientRequest,
  HttpClientResponse,
} from "@effect/platform";
import * as Effect from "effect/Effect";
import { unsafeCoerce } from "effect/Function";

import { UploadThingError } from "@uploadthing/shared";

import { version } from "../../package.json";
import type { FileEsque } from "../sdk/types";
import type { UploadPutResult } from "./types";

export const uploadWithoutProgress = (
  file: FileEsque,
  presigned: { key: string; url: string },
) =>
  Effect.gen(function* () {
    const formData = new FormData();
    formData.append("file", file as Blob); // File data **MUST GO LAST**

    const httpClient = yield* HttpClient.HttpClient;
    const json = yield* HttpClientRequest.put(presigned.url).pipe(
      HttpClientRequest.formDataBody(formData),
      HttpClientRequest.setHeader("Range", "bytes=0-"),
      HttpClientRequest.setHeader("x-uploadthing-version", version),
      HttpClient.filterStatusOk(httpClient),
      Effect.mapError(
        (e) =>
          new UploadThingError({
            code: "UPLOAD_FAILED",
            message: "Failed to upload file",
            cause: e,
          }),
      ),
      HttpClientResponse.json,
      Effect.andThen(unsafeCoerce<unknown, UploadPutResult>),
    );

    yield* Effect.logDebug(`File ${file.name} uploaded successfully`).pipe(
      Effect.annotateLogs("json", json),
    );
    return json;
  });
