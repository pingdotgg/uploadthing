import { Effect } from "effect";

import { UploadThingError } from "@uploadthing/shared";

import type { PSPResponse } from "./shared-schemas";

export const uploadPresignedPostWithProgress = (
  file: File,
  presigned: PSPResponse,
  opts: {
    onUploadProgress?: ({
      file,
      progress,
    }: {
      file: string;
      progress: number;
    }) => void;
  },
) =>
  Effect.gen(function* ($) {
    const formData = new FormData();
    Object.entries(presigned.fields).forEach(([k, v]) => formData.append(k, v));
    formData.append("file", file); // File data **MUST GO LAST**

    const response = yield* $(
      Effect.promise(
        () =>
          new Promise<XMLHttpRequest>((resolve, reject) => {
            const xhr = new XMLHttpRequest();
            xhr.open("POST", presigned.url);
            xhr.setRequestHeader("Accept", "application/xml");
            xhr.upload.onprogress = (p) => {
              opts.onUploadProgress?.({
                file: file.name,
                progress: (p.loaded / p.total) * 100,
              });
            };
            xhr.onload = (e) => resolve(e.target as XMLHttpRequest);
            xhr.onerror = (e) => reject(e);
            xhr.send(formData);
          }),
      ),
    );

    if (response.status > 299 || response.status < 200) {
      return yield* $(
        new UploadThingError({
          code: "UPLOAD_FAILED",
          message: "Failed to upload file",
          cause: response,
        }),
      );
    }
  });
