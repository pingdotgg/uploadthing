import * as Effect from "effect/Effect";

import type { FetchContext } from "@uploadthing/shared";
import { UploadThingError } from "@uploadthing/shared";

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
      console.log("XHR upload progress", loaded);
      const delta = loaded - previousLoaded;
      onUploadProgress?.({ loaded, delta });
      previousLoaded = loaded;
    });
    xhr.addEventListener("load", () => {
      console.log("XHR load", xhr.status, xhr.statusText);
      resume(
        xhr.status >= 200 && xhr.status < 300
          ? Effect.succeed(xhr.response)
          : Effect.die(
              `XHR failed ${xhr.status} ${xhr.statusText} - ${JSON.stringify(xhr.response)}`,
            ),
      );
    });

    xhr.upload.addEventListener("error", (e) => {
      console.log("XHR upload error", e);
    });
    xhr.upload.addEventListener("abort", (e) => {
      console.log("XHR abort error", e);
    });

    // Is there a case when the client would throw and
    // ingest server not knowing about it? idts?
    xhr.addEventListener("error", () => {
      console.log("XHR error", xhr.status, xhr.statusText);
      resume(
        new UploadThingError({
          code: "UPLOAD_FAILED",
        }),
      );
    });

    const formData = new FormData();
    formData.append("file", file.slice(rangeStart));
    xhr.send(formData);
  });
