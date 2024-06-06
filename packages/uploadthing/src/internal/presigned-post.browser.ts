import * as Effect from "effect/Effect";

import type { FetchContext, UploadThingError } from "@uploadthing/shared";
import { NewPresignedUrl } from "uploadthing/types";

import type { UTReporter } from "./ut-reporter";

export const uploadPresignedPostWithProgress = (
  file: File,
  presigned: NewPresignedUrl,
  opts: {
    reportEventToUT: UTReporter;
    onUploadProgress?:
      | ((opts: { file: string; progress: number }) => void)
      | undefined;
  },
) =>
  Effect.async<unknown, UploadThingError, FetchContext>((resume) => {
    const xhr = new XMLHttpRequest();
    xhr.open("PUT", presigned.url, true);
    xhr.setRequestHeader("Accept", "application/xml");
    xhr.setRequestHeader("Range", `bytes=0-`);

    xhr.upload.addEventListener("progress", ({ loaded, total }) => {
      opts.onUploadProgress?.({
        file: file.name,
        progress: (loaded / total) * 100,
      });
    });
    xhr.addEventListener("load", () => {
      resume(
        xhr.status >= 200 && xhr.status < 300
          ? Effect.succeed(null)
          : Effect.die(`XHR failed ${xhr.status} ${xhr.statusText}`),
      );
    });
    xhr.addEventListener("error", () => {
      resume(
        opts.reportEventToUT("failure", {
          fileKey: presigned.key,
          uploadId: null,
          fileName: file.name,
        }),
      );
    });

    const formData = new FormData();
    formData.append("file", file);
    xhr.send(formData);
  });
