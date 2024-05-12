import * as Effect from "effect/Effect";

import type { FetchContext, UploadThingError } from "@uploadthing/shared";

import type { PSPResponse, UTEvents } from "./types";
import type { UTReporter } from "./ut-reporter";

export const uploadPresignedPostWithProgress = (
  file: File,
  presigned: PSPResponse,
  opts: {
    reportEventToUT: UTReporter;
    onUploadProgress?:
      | ((opts: { file: string; progress: number }) => void)
      | undefined;
  },
) =>
  Effect.async<UTEvents[keyof UTEvents]["out"], UploadThingError, FetchContext>(
    (resume) => {
      const xhr = new XMLHttpRequest();
      xhr.open("POST", presigned.url);
      xhr.setRequestHeader("Accept", "application/xml");

      xhr.upload.addEventListener("progress", ({ loaded, total }) => {
        opts.onUploadProgress?.({
          file: file.name,
          progress: (loaded / total) * 100,
        });
      });
      xhr.addEventListener("load", () =>
        resume(
          xhr.status >= 200 && xhr.status < 300
            ? Effect.succeed(null)
            : opts.reportEventToUT("failure", {
                fileKey: presigned.key,
                uploadId: null,
                fileName: file.name,
                storageProviderError: xhr.responseText,
              }),
        ),
      );
      xhr.addEventListener("error", () =>
        resume(
          opts.reportEventToUT("failure", {
            fileKey: presigned.key,
            uploadId: null,
            fileName: file.name,
          }),
        ),
      );

      const formData = new FormData();
      Object.entries(presigned.fields).forEach(([k, v]) =>
        formData.append(k, v),
      );
      formData.append("file", file); // File data **MUST GO LAST**
      xhr.send(formData);
    },
  );
