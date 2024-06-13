import * as Effect from "effect/Effect";

import type { FetchContext, UploadThingError } from "@uploadthing/shared";

import type { NewPresignedUrl } from "../types";

export const uploadWithProgress = (
  file: File,
  rangeStart: number,
  presigned: NewPresignedUrl,
  onUploadProgress?:
    | ((opts: { loaded: number; delta: number }) => void)
    | undefined,
) =>
  Effect.async<unknown, UploadThingError, FetchContext>((resume, signal) => {
    const xhr = new XMLHttpRequest();
    xhr.open("PUT", presigned.url, true);
    xhr.setRequestHeader("Range", `bytes=${rangeStart}-`);
    xhr.responseType = "json";

    signal.addEventListener("abort", () => {
      xhr.abort();
    });

    let previousLoaded = 0;
    xhr.upload.addEventListener("progress", ({ loaded }) => {
      const delta = loaded - previousLoaded;
      onUploadProgress?.({ loaded, delta });
      previousLoaded = loaded;
    });
    xhr.addEventListener("load", () => {
      resume(
        xhr.status >= 200 && xhr.status < 300
          ? Effect.succeed(xhr.response)
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
    formData.append("file", file.slice(rangeStart));
    xhr.send(formData);
  });
