import * as S from "@effect/schema/Schema";
import { Cause, Effect } from "effect";

import {
  contentDisposition,
  fetchEffJson,
  generateUploadThingURL,
  UploadThingError,
} from "@uploadthing/shared";
import type { ContentDisposition } from "@uploadthing/shared";

import type { MPUResponse } from "./shared-schemas";
import type { createUTReporter } from "./ut-reporter";

export const uploadMultipartWithProgress = (
  file: File,
  presigned: MPUResponse,
  opts: {
    reportEventToUT: ReturnType<typeof createUTReporter>;
    onUploadProgress?: (opts: { file: string; progress: number }) => void;
  },
) => {
  let uploadedBytes = 0;

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
        opts.reportEventToUT("failure", {
          fileKey: presigned.key,
          uploadId: presigned.uploadId,
          fileName: file.name,
          s3Error: Cause.pretty(error).toString(),
        }),
      ),
    );

    // Tell the server that the upload is complete
    const uploadOk = yield* $(
      opts.reportEventToUT("multipart-complete", {
        uploadId: presigned.uploadId,
        fileKey: presigned.key,
        etags,
      }),
    );
    if (!uploadOk) {
      return yield* $(
        new UploadThingError({
          code: "UPLOAD_FAILED",
          message: "Failed to alert UT of upload completion",
        }),
      );
    }
  });
};

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

const uploadPartWithProgress = (
  opts: Parameters<typeof uploadPartWithProgressInternal>[0],
  retryCount?: number,
) => Effect.promise(() => uploadPartWithProgressInternal(opts, retryCount));
