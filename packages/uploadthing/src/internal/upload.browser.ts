import * as Effect from "effect/Effect";

import type { FetchContext, UploadThingError } from "@uploadthing/shared";

import type { NewPresignedUrl } from "../types";

export const uploadWithProgress = (
  file: File,
  presigned: NewPresignedUrl,
  onUploadProgress?:
    | ((opts: { file: string; progress: number }) => void)
    | undefined,
) =>
  Effect.async<unknown, UploadThingError, FetchContext>((resume) => {
    const xhr = new XMLHttpRequest();
    xhr.open("PUT", presigned.url, true);
    xhr.setRequestHeader("Accept", "application/xml");
    xhr.setRequestHeader("Range", `bytes=0-`);

    xhr.upload.addEventListener("progress", ({ loaded, total }) => {
      onUploadProgress?.({
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
    // Is there a case when the client would throw and
    // ingest server not knowing about it? idts?
    // xhr.addEventListener("error", () => {
    //   resume(
    //     opts.reportEventToUT("failure", {
    //       fileKey: presigned.key,
    //       uploadId: null,
    //       fileName: file.name,
    //     }),
    //   );
    // });

    const formData = new FormData();
    formData.append("file", file);
    xhr.send(formData);

    return Effect.sync(() => xhr.abort());
  });
