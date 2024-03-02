import { Effect } from "effect";

import type { FetchContextTag } from "@uploadthing/shared";

import type { PSPResponse } from "./shared-schemas";
import type { createUTReporter, UTReporterError } from "./ut-reporter";

export const uploadPresignedPostWithProgress = (
  file: File,
  presigned: PSPResponse,
  opts: {
    reportEventToUT: ReturnType<typeof createUTReporter>;
    onUploadProgress?: (opts: { file: string; progress: number }) => void;
  },
) =>
  Effect.async<boolean, UTReporterError, FetchContextTag>((resume) => {
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
          ? Effect.succeed(true)
          : opts.reportEventToUT("failure", {
              fileKey: presigned.key,
              uploadId: null,
              fileName: file.name,
              s3Error: xhr.responseText,
            }),
      );
    xhr.onerror = (_e) =>
      resume(
        opts.reportEventToUT("failure", {
          fileKey: presigned.key,
          uploadId: null,
          fileName: file.name,
          // s3Error: _e.toString(),
        }),
      );

    const formData = new FormData();
    Object.entries(presigned.fields).forEach(([k, v]) => formData.append(k, v));
    formData.append("file", file); // File data **MUST GO LAST**
    xhr.send(formData);
  });
