import * as S from "@effect/schema/Schema";
import { Effect } from "effect";

import {
  contentDisposition,
  exponentialBackoff,
  fetchEff,
  fetchEffJson,
  generateUploadThingURL,
  RetryError,
  UploadThingError,
} from "@uploadthing/shared";
import type { ContentDisposition } from "@uploadthing/shared";

import type { FileEsque } from "../sdk/types";
import { logger } from "./logger";
import type { MPUResponse } from "./types";

export const uploadMultipart = (file: FileEsque, presigned: MPUResponse) =>
  Effect.gen(function* ($) {
    logger.debug(
      `Uploading file ${file.name} with ${presigned.urls.length} chunks of size ${presigned.chunkSize} bytes each`,
    );

    const etags = yield* $(
      Effect.forEach(
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
      ),
    );

    logger.debug("File", file.name, "uploaded successfully.");
    logger.debug("Completing multipart upload...");
    yield* $(completeMultipartUpload(presigned, etags));
    logger.debug("Multipart upload complete.");
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
      schedule: exponentialBackoff,
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
  fetchEffJson(
    generateUploadThingURL("/api/completeMultipart"),
    S.struct({ success: S.boolean, message: S.optional(S.string) }),
    {
      method: "POST",
      body: JSON.stringify({
        fileKey: presigned.key,
        uploadId: presigned.uploadId,
        etags,
      }),
      headers: { "Content-Type": "application/json" },
    },
  );

export const abortMultipartUpload = (presigned: {
  key: string;
  uploadId: string | null;
}) =>
  fetchEffJson(
    generateUploadThingURL("/api/failureCallback"),
    S.struct({ success: S.boolean, message: S.optional(S.string) }),
    {
      method: "POST",
      body: JSON.stringify({
        fileKey: presigned.key,
        uploadId: presigned.uploadId,
      }),
      headers: { "Content-Type": "application/json" },
    },
  );
