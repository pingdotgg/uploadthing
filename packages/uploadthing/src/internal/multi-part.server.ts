/**
 * The `import type * as _MAKE_TS_AWARE_1 from` are imported to make TypeScript aware of the types.
 * It's having a hard time resolving deeply nested stuff from transitive dependencies.
 * You'll notice if you need to add more imports if you get build errors like:
 * `The type of X cannot be inferred without a reference to <MODULE>`
 */
import * as S from "@effect/schema/Schema";
import { Effect } from "effect";
import type * as _MAKE_TS_AWARE_1 from "effect/Cause";

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
import { maybeParseResponseXML } from "./s3-error-parser";
import type { MPUResponse } from "./shared-schemas";

export const uploadMultipart = (file: FileEsque, presigned: MPUResponse) =>
  Effect.gen(function* ($) {
    logger.debug(
      "Uploading file",
      file.name,
      "with",
      presigned.urls.length,
      "chunks of size",
      presigned.chunkSize,
      "bytes each",
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
          }).pipe(
            Effect.andThen((etag) => ({ tag: etag, partNumber: index + 1 })),
            Effect.catchTag("RetryError", (e) => Effect.die(e)),
          );
        },
        { concurrency: "inherit" },
      ),
    );

    logger.debug("File", file.name, "uploaded successfully.");
    logger.debug("Comleting multipart upload...");
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
      fetchEff(generateUploadThingURL("/api/failureCallback"), {
        method: "POST",
        body: JSON.stringify({
          fileKey: opts.key,
        }),
      }).pipe(
        Effect.andThen(async (res) => {
          const parsed = maybeParseResponseXML(await res.text());
          Effect.fail(
            new UploadThingError({
              code: parsed?.code ?? "UPLOAD_FAILED",
              message:
                parsed?.message ??
                `Failed to upload file ${opts.fileName} to S3`,
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
    },
  );

export const abortMultipartUpload = (presigned: {
  key: string;
  uploadId: string;
}) =>
  fetchEffJson(
    generateUploadThingURL("/api/failMultipart"),
    S.struct({ success: S.boolean, message: S.optional(S.string) }),
    {
      method: "POST",
      body: JSON.stringify({
        fileKey: presigned.key,
        uploadId: presigned.uploadId,
      }),
    },
  );
