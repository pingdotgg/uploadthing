import * as S from "@effect/schema/Schema";
import * as Effect from "effect/Effect";

import {
  contentDisposition,
  exponentialBackoff,
  fetchEff,
  generateUploadThingURL,
  parseResponseJson,
  RetryError,
  UploadThingError,
} from "@uploadthing/shared";
import type { ContentDisposition } from "@uploadthing/shared";

import type { FileEsque } from "../sdk/types";
import { FailureCallbackResponseSchema } from "./shared-schemas";
import type { MPUResponse } from "./types";

export const uploadMultipart = (file: FileEsque, presigned: MPUResponse) =>
  Effect.gen(function* () {
    yield* Effect.logDebug(
      `Uploading file ${file.name} with ${presigned.urls.length} chunks of size ${presigned.chunkSize} bytes each`,
    );

    const etags = yield* Effect.forEach(
      presigned.urls,
      (url, index) => {
        const offset = presigned.chunkSize * index;
        const end = Math.min(offset + presigned.chunkSize, file.size);
        const chunk = file.slice(offset, end);

        return uploadPart({
          url,
          chunk: chunk as Blob,
          contentDisposition: presigned.contentDisposition,
          contentType: file.type,
          fileName: file.name,
          maxRetries: 10,
          key: presigned.key,
          uploadId: presigned.uploadId,
        }).pipe(
          Effect.andThen((etag) => ({ tag: etag, partNumber: index + 1 })),
          Effect.catchTag("RetryError", (e) => Effect.die(e)),
        );
      },
      { concurrency: "inherit" },
    );

    yield* Effect.logDebug("File", file.name, "uploaded successfully.");
    yield* Effect.logDebug("Completing multipart upload...");
    yield* completeMultipartUpload(presigned, etags);
    yield* Effect.logDebug("Multipart upload complete.");
  });

/**
 * Used by server uploads where progress is not needed.
 * Uses normal fetch API.
 */
const uploadPart = (opts: {
  url: string;
  key: string;
  uploadId: string;
  chunk: Blob;
  contentType: string;
  contentDisposition: ContentDisposition;
  fileName: string;
  maxRetries: number;
}) =>
  fetchEff(opts.url, {
    method: "PUT",
    body: opts.chunk,
    headers: {
      "Content-Type": opts.contentType,
      "Content-Disposition": contentDisposition(
        opts.contentDisposition,
        opts.fileName,
      ),
    },
  }).pipe(
    Effect.andThen((res) =>
      res.ok && res.headers.get("Etag")
        ? Effect.succeed(res.headers.get("Etag")!)
        : Effect.fail(new RetryError()),
    ),
    Effect.retry({
      while: (res) => res instanceof RetryError,
      schedule: exponentialBackoff(),
      times: opts.maxRetries,
    }),
    Effect.tapErrorTag("RetryError", () =>
      // Max retries exceeded, tell UT server that upload failed
      abortMultipartUpload({ key: opts.key, uploadId: opts.uploadId }).pipe(
        Effect.andThen((res) => {
          Effect.fail(
            new UploadThingError({
              code: "UPLOAD_FAILED",
              message: `Failed to upload file ${opts.fileName} to S3`,
              cause: res,
            }),
          );
        }),
      ),
    ),
  );

export const completeMultipartUpload = (
  presigned: { key: string; uploadId: string },
  etags: readonly { tag: string; partNumber: number }[],
) =>
  fetchEff(generateUploadThingURL("/api/completeMultipart"), {
    method: "POST",
    body: JSON.stringify({
      fileKey: presigned.key,
      uploadId: presigned.uploadId,
      etags,
    }),
    headers: { "Content-Type": "application/json" },
  }).pipe(
    Effect.andThen(parseResponseJson),
    Effect.andThen(
      S.decodeUnknown(
        S.Struct({ success: S.Boolean, message: S.optional(S.String) }),
      ),
    ),
    Effect.withSpan("completeMultipartUpload", {
      attributes: { etags, presigned },
    }),
  );

export const abortMultipartUpload = (presigned: {
  key: string;
  uploadId: string | null;
}) =>
  fetchEff(
    generateUploadThingURL("/api/failureCallback"),

    {
      method: "POST",
      body: JSON.stringify({
        fileKey: presigned.key,
        uploadId: presigned.uploadId,
      }),
      headers: { "Content-Type": "application/json" },
    },
  ).pipe(
    Effect.andThen(parseResponseJson),
    Effect.andThen(S.decodeUnknown(FailureCallbackResponseSchema)),
    Effect.withSpan("abortMultipartUpload", {
      attributes: { presigned },
    }),
  );
