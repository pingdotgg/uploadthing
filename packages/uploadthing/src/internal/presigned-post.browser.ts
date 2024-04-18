import * as S from "@effect/schema/Schema";
import { Effect } from "effect";

import type { FetchContextTag, UploadThingError } from "@uploadthing/shared";

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
  Effect.async<
    UTEvents[keyof UTEvents]["out"],
    UploadThingError,
    FetchContextTag
  >((resume) => {
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
          ? Effect.succeed(null)
          : opts.reportEventToUT(
              "failure",
              {
                fileKey: presigned.key,
                uploadId: null,
                fileName: file.name,
                storageProviderError: xhr.responseText,
              },
              S.Null,
            ),
      );
    xhr.onerror = () =>
      resume(
        opts.reportEventToUT(
          "failure",
          {
            fileKey: presigned.key,
            uploadId: null,
            fileName: file.name,
          },
          S.Null,
        ),
      );

    const formData = new FormData();
    Object.entries(presigned.fields).forEach(([k, v]) => formData.append(k, v));
    formData.append("file", file); // File data **MUST GO LAST**
    xhr.send(formData);
  });
