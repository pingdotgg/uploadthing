import { Effect } from "effect";

import type { FetchContextTag, UploadThingError } from "@uploadthing/shared";

import type { PSPResponse } from "./shared-schemas";
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
  Effect.async<{ success: boolean }, UploadThingError, FetchContextTag>(
    (resume) => {
      const xhr = new XMLHttpRequest();
      xhr.open("POST", presigned.url);
      xhr.setRequestHeader("Accept", "application/xml");
      xhr.upload.onprogress = (p) => {
        opts.onUploadProgress?.({
          file: file.name,
          progress: (p.loaded / p.total) * 100,
        });
      };
      xhr.onload = () =>
        resume(
          xhr.status >= 200 && xhr.status < 300
            ? Effect.succeed({ success: true })
            : opts.reportEventToUT("failure", {
                fileKey: presigned.key,
                uploadId: null,
                fileName: file.name,
                s3Error: xhr.responseText,
              }),
        );
      xhr.onerror = () =>
        resume(
          opts.reportEventToUT("failure", {
            fileKey: presigned.key,
            uploadId: null,
            fileName: file.name,
          }),
        );

      const formData = new FormData();
      Object.entries(presigned.fields).forEach(([k, v]) =>
        formData.append(k, v),
      );
      formData.append("file", file); // File data **MUST GO LAST**
      xhr.send(formData);
    },
  );
