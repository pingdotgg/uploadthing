import * as Micro from "effect/Micro";
import { isTest } from "std-env";

import {
  contentDisposition,
  exponentialDelay,
  RetryError,
} from "@uploadthing/shared";
import type { ContentDisposition, UploadThingError } from "@uploadthing/shared";

import type { MPUResponse } from "./shared-schemas";
import type { UTReporter } from "./ut-reporter";

export const uploadMultipartWithProgress = (
  file: File,
  presigned: MPUResponse,
  opts: {
    reportEventToUT: UTReporter;
    onUploadProgress?:
      | ((opts: { file: string; progress: number }) => void)
      | undefined;
  },
) =>
  Micro.gen(function* () {
    let uploadedBytes = 0;
    const etags = yield* Micro.forEach(
      presigned.urls,
      (url, index) => {
        const offset = presigned.chunkSize * index;
        const end = Math.min(offset + presigned.chunkSize, file.size);
        const chunk = file.slice(offset, end);

        return uploadPart({
          url,
          chunk: chunk,
          contentDisposition: presigned.contentDisposition,
          fileType: file.type,
          fileName: file.name,
          onProgress: (delta) => {
            uploadedBytes += delta;
            const percent = (uploadedBytes / file.size) * 100;
            opts.onUploadProgress?.({ file: file.name, progress: percent });
          },
        }).pipe(
          Micro.andThen((tag) => ({ tag, partNumber: index + 1 })),
          Micro.retry({
            while: (error) => error instanceof RetryError,
            times: isTest ? 3 : 10, // less retries in tests just to make it faster
            delay: exponentialDelay,
          }),
        );
      },
      { concurrency: "inherit" },
    ).pipe(
      Micro.tapError((error) =>
        opts.reportEventToUT("failure", {
          fileKey: presigned.key,
          uploadId: presigned.uploadId,
          fileName: file.name,
          storageProviderError: String(error),
        }),
      ),
    );

    // Tell the server that the upload is complete
    yield* opts.reportEventToUT("multipart-complete", {
      uploadId: presigned.uploadId,
      fileKey: presigned.key,
      etags,
    });
  });

interface UploadPartOptions {
  url: string;
  chunk: Blob;
  fileType: string;
  fileName: string;
  contentDisposition: ContentDisposition;
  onProgress: (progressDelta: number) => void;
}

const uploadPart = (opts: UploadPartOptions) =>
  Micro.async<string, UploadThingError | RetryError>((resume) => {
    const xhr = new XMLHttpRequest();

    xhr.open("PUT", opts.url, true);
    xhr.setRequestHeader("Content-Type", opts.fileType);
    xhr.setRequestHeader(
      "Content-Disposition",
      contentDisposition(opts.contentDisposition, opts.fileName),
    );

    xhr.addEventListener("load", () => {
      const etag = xhr.getResponseHeader("Etag");
      if (xhr.status >= 200 && xhr.status <= 299 && etag) {
        return resume(Micro.succeed(etag));
      }
      return resume(Micro.fail(new RetryError()));
    });
    xhr.addEventListener("error", () => resume(Micro.fail(new RetryError())));

    let lastProgress = 0;
    xhr.upload.addEventListener("progress", (e) => {
      const delta = e.loaded - lastProgress;
      lastProgress += delta;
      opts.onProgress(delta);
    });

    xhr.send(opts.chunk);

    // Cleanup function that runs on interruption
    return Micro.sync(() => xhr.abort());
  });
