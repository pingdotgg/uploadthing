import { Effect } from "effect";

import { fetchEff, UploadThingError } from "@uploadthing/shared";
import type { FileEsque } from "uploadthing/sdk/utils";

import { logger } from "./logger";
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
      throw new UploadThingError({
        code: "UPLOAD_FAILED",
        message: "Failed to upload file",
        cause: response,
      });
    }
  });

export const uploadPresignedPost = (file: FileEsque, presigned: PSPResponse) =>
  Effect.gen(function* ($) {
    logger.debug("Uploading file", file.name, "using presigned POST URL");
    const formData = new FormData();
    Object.entries(presigned.fields).forEach(([k, v]) => formData.append(k, v));
    formData.append("file", file as Blob); // File data **MUST GO LAST**

    const res = yield* $(
      fetchEff(presigned.url, {
        method: "POST",
        body: formData,
        headers: new Headers({
          Accept: "application/xml",
        }),
      }),
    );

    if (!res.ok) {
      const text = yield* $(Effect.promise(res.text));
      logger.error("Failed to upload file:", text);
      throw new UploadThingError({
        code: "UPLOAD_FAILED",
        message: "Failed to upload file",
        cause: text,
      });
    }

    logger.debug("File", file.name, "uploaded successfully");
  });
