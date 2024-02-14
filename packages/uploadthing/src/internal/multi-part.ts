import * as S from "@effect/schema/Schema";
import { Cause, Effect } from "effect";

import "@uploadthing/shared";

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
import type { FileEsque } from "uploadthing/sdk/utils";

import { logger } from "./logger";
import { maybeParseResponseXML } from "./s3-error-parser";
import type { MPUResponse } from "./shared-schemas";
import { createUTReporter } from "./ut-reporter";

// import { maybeParseResponseXML } from "./s3-error-parser";

export const uploadMultipartWithProgress = (
  file: File,
  presigned: MPUResponse,
  opts: {
    endpoint: string;
    package: string;
    url: URL;
    onUploadProgress?: ({
      file,
      progress,
    }: {
      file: string;
      progress: number;
    }) => void;
  },
) => {
  let uploadedBytes = 0;

  const reportEventToUT = createUTReporter({
    endpoint: opts.endpoint,
    package: opts.package,
    url: opts.url,
  });

  return Effect.gen(function* ($) {
    const etags = yield* $(
      Effect.forEach(
        presigned.urls,
        (url, index) => {
          const offset = presigned.chunkSize * index;
          const end = Math.min(offset + presigned.chunkSize, file.size);
          const chunk = file.slice(offset, end);

          return uploadPartWithProgress({
            url,
            chunk: chunk,
            contentDisposition: presigned.contentDisposition,
            fileType: file.type,
            fileName: file.name,
            maxRetries: 10,
            onProgress: (delta) => {
              uploadedBytes += delta;
              const percent = (uploadedBytes / file.size) * 100;
              opts.onUploadProgress?.({ file: file.name, progress: percent });
            },
          }).pipe(Effect.andThen((tag) => ({ tag, partNumber: index + 1 })));
        },
        { concurrency: "inherit" },
      ),
      Effect.tapErrorCause((error) =>
        reportEventToUT("failure", {
          fileKey: presigned.key,
          uploadId: presigned.uploadId,
          fileName: file.name,
          s3Error: Cause.pretty(error).toString(),
        }),
      ),
    );

    // Tell the server that the upload is complete
    const uploadOk = yield* $(
      reportEventToUT("multipart-complete", {
        uploadId: presigned.uploadId,
        fileKey: presigned.key,
        etags,
      }),
    );
    if (!uploadOk) {
      logger.info("Failed to alert UT of upload completion");
      return yield* $(
        new UploadThingError({
          code: "UPLOAD_FAILED",
          message: "Failed to alert UT of upload completion",
        }),
      );
    }
  });
};

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
export const uploadPart = (opts: {
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
  etags: { tag: string; partNumber: number }[],
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

/**
 * Used by client uploads where progress is needed.
 * Uses XMLHttpRequest.
 *
 * FIXME: Effecti-fy this. Maybe use `Effect.async` and use the AbortSignal to provide cancellation
 */
const uploadPartWithProgressInternal = async (
  opts: {
    url: string;
    chunk: Blob;
    fileType: string;
    fileName: string;
    contentDisposition: ContentDisposition;
    maxRetries: number;
    onProgress: (progressDelta: number) => void;
  },
  retryCount = 0,
) =>
  new Promise<string>((resolve, reject) => {
    const xhr = new XMLHttpRequest();

    xhr.open("PUT", opts.url, true);
    xhr.setRequestHeader("Content-Type", opts.fileType);
    xhr.setRequestHeader(
      "Content-Disposition",
      contentDisposition(opts.contentDisposition, opts.fileName),
    );

    xhr.onload = async () => {
      if (xhr.status >= 200 && xhr.status < 300) {
        const etag = xhr.getResponseHeader("Etag");
        etag ? resolve(etag) : reject("NO ETAG");
      } else if (retryCount < opts.maxRetries) {
        // Add a delay before retrying (exponential backoff can be used)
        const delay = Math.pow(2, retryCount) * 1000;
        await new Promise((res) => setTimeout(res, delay));
        await uploadPartWithProgressInternal(opts, retryCount + 1); // Retry the request
      } else {
        reject("Max retries exceeded");
      }
    };

    let lastProgress = 0;

    xhr.onerror = async () => {
      lastProgress = 0;
      if (retryCount < opts.maxRetries) {
        // Add a delay before retrying (exponential backoff can be used)
        const delay = Math.pow(2, retryCount) * 100;
        await new Promise((res) => setTimeout(res, delay));
        await uploadPartWithProgressInternal(opts, retryCount + 1); // Retry the request
      } else {
        reject("Max retries exceeded");
      }
    };

    xhr.upload.onprogress = (e) => {
      const delta = e.loaded - lastProgress;
      lastProgress += delta;
      opts.onProgress(delta);
    };

    xhr.send(opts.chunk);
  });

export const uploadPartWithProgress = (
  opts: Parameters<typeof uploadPartWithProgressInternal>[0],
  retryCount?: number,
) => Effect.promise(() => uploadPartWithProgressInternal(opts, retryCount));
