import { Effect, pipe } from "effect";

import "@uploadthing/shared";

import {
  contentDisposition,
  exponentialBackoff,
  fetchEff,
  generateUploadThingURL,
  UploadThingError,
} from "@uploadthing/shared";
import type { ContentDisposition } from "@uploadthing/shared";

// import { maybeParseResponseXML } from "./s3-error-parser";

/**
 * Used by server uploads where progress is not needed.
 * Uses normal fetch API.
 */
export function uploadPart(opts: {
  url: string;
  key: string;
  chunk: Blob;
  contentType: string;
  contentDisposition: ContentDisposition;
  fileName: string;
  maxRetries: number;
}) {
  return Effect.gen(function* ($) {
    return yield* $(
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
      }),
      Effect.andThen((res) =>
        res.ok && res.headers.get("Etag")
          ? Effect.succeed(res.headers.get("Etag")!)
          : Effect.fail({ _tag: "Retry" as const }),
      ),
      Effect.retry({
        while: (res) => res._tag === "Retry",
        schedule: exponentialBackoff,
        times: opts.maxRetries,
      }),
      Effect.tapErrorTag("Retry", () =>
        pipe(
          // Max retries exceeded, tell UT server that upload failed
          fetchEff(generateUploadThingURL("/api/failureCallback"), {
            method: "POST",
            body: JSON.stringify({
              fileKey: opts.key,
            }),
          }),
          Effect.andThen(() =>
            Effect.fail(
              new UploadThingError({
                code: "UPLOAD_FAILED",
                // TODO: Add S3 error parsing back
                message: "Failed to upload file to storage provider",
                // cause: s3Res,
              }),
            ),
          ),
        ),
      ),
    );
  });
}

/**
 * Used by client uploads where progress is needed.
 * Uses XMLHttpRequest.
 */
async function uploadPartWithProgressInternal(
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
) {
  return new Promise<string>((resolve, reject) => {
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
}

export const uploadPartWithProgress = (
  opts: Parameters<typeof uploadPartWithProgressInternal>[0],
  retryCount?: number,
) => Effect.promise(() => uploadPartWithProgressInternal(opts, retryCount));
