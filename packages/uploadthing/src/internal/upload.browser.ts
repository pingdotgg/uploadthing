import { unsafeCoerce } from "effect/Function";
import * as Micro from "effect/Micro";

import type { FetchError } from "@uploadthing/shared";
import { FetchContext, fetchEff, UploadThingError } from "@uploadthing/shared";

import { version } from "../../package.json";
import type {
  ClientUploadedFileData,
  FileRouter,
  inferEndpointOutput,
  NewPresignedUrl,
  UploadFilesOptions,
} from "../types";
import type { UploadPutResult } from "./types";
import { createUTReporter } from "./ut-reporter";

const uploadWithProgress = (
  file: File,
  rangeStart: number,
  presigned: NewPresignedUrl,
  onUploadProgress?:
    | ((opts: { loaded: number; delta: number }) => void)
    | undefined,
) =>
  Micro.async<unknown, UploadThingError, FetchContext>((resume) => {
    const xhr = new XMLHttpRequest();
    xhr.open("PUT", presigned.url, true);
    xhr.setRequestHeader("Range", `bytes=${rangeStart}-`);
    xhr.setRequestHeader("x-uploadthing-version", version);
    xhr.responseType = "json";

    let previousLoaded = 0;
    xhr.upload.addEventListener("progress", ({ loaded }) => {
      const delta = loaded - previousLoaded;
      onUploadProgress?.({ loaded, delta });
      previousLoaded = loaded;
    });
    xhr.addEventListener("load", () => {
      resume(
        xhr.status >= 200 && xhr.status < 300
          ? Micro.succeed(xhr.response)
          : Micro.die(
              `XHR failed ${xhr.status} ${xhr.statusText} - ${JSON.stringify(xhr.response)}`,
            ),
      );
    });

    // Is there a case when the client would throw and
    // ingest server not knowing about it? idts?
    xhr.addEventListener("error", () => {
      resume(
        new UploadThingError({
          code: "UPLOAD_FAILED",
        }),
      );
    });

    const formData = new FormData();
    formData.append(
      "file",
      new File([file.slice(rangeStart)], file.name, {
        lastModified: file.lastModified,
        type: file.type,
      }),
    );
    xhr.send(formData);

    return Micro.sync(() => xhr.abort());
  });

export const uploadFile = <
  TRouter extends FileRouter,
  TEndpoint extends keyof TRouter,
  TServerOutput = inferEndpointOutput<TRouter[TEndpoint]>,
>(
  file: File,
  presigned: NewPresignedUrl,
  opts: {
    onUploadProgress?: (progressEvent: {
      loaded: number;
      delta: number;
    }) => void;
  },
) =>
  fetchEff(presigned.url, { method: "HEAD" }).pipe(
    Micro.map(({ headers }) =>
      parseInt(headers.get("x-ut-range-start") ?? "0", 10),
    ),
    Micro.tap((start) =>
      opts.onUploadProgress?.({
        delta: start,
        loaded: start,
      }),
    ),
    Micro.flatMap((start) =>
      uploadWithProgress(file, start, presigned, (progressEvent) =>
        opts.onUploadProgress?.({
          delta: progressEvent.delta,
          loaded: progressEvent.loaded + start,
        }),
      ),
    ),
    Micro.map(unsafeCoerce<unknown, UploadPutResult<TServerOutput>>),
    Micro.map((uploadResponse) => ({
      name: file.name,
      size: file.size,
      key: presigned.key,
      lastModified: file.lastModified,
      serverData: uploadResponse.serverData,
      url: uploadResponse.url,
      appUrl: uploadResponse.appUrl,
      customId: presigned.customId,
      type: file.type,
      fileHash: uploadResponse.fileHash,
    })),
  );

export const uploadFilesInternal = <
  TRouter extends FileRouter,
  TEndpoint extends keyof TRouter,
  TServerOutput = inferEndpointOutput<TRouter[TEndpoint]>,
>(
  endpoint: TEndpoint,
  opts: UploadFilesOptions<TRouter, TEndpoint>,
): Micro.Micro<
  ClientUploadedFileData<TServerOutput>[],
  UploadThingError | FetchError
> => {
  // classic service right here
  const reportEventToUT = createUTReporter({
    endpoint: String(endpoint),
    package: opts.package,
    url: opts.url,
    headers: opts.headers,
  });

  const totalSize = opts.files.reduce((acc, f) => acc + f.size, 0);
  let totalLoaded = 0;

  return reportEventToUT("upload", {
    input: "input" in opts ? opts.input : null,
    files: opts.files.map((f) => ({
      name: f.name,
      size: f.size,
      type: f.type,
      lastModified: f.lastModified,
    })),
  }).pipe(
    Micro.flatMap((presigneds) =>
      Micro.forEach(
        presigneds,
        (presigned, i) =>
          Micro.flatMap(
            Micro.sync(() =>
              opts.onUploadBegin?.({ file: opts.files[i].name }),
            ),
            () =>
              uploadFile<TRouter, TEndpoint, TServerOutput>(
                opts.files[i],
                presigned,
                {
                  onUploadProgress: (ev) => {
                    totalLoaded += ev.delta;
                    opts.onUploadProgress?.({
                      file: opts.files[i],
                      progress: Math.round(
                        (ev.loaded / opts.files[i].size) * 100,
                      ),
                      loaded: ev.loaded,
                      delta: ev.delta,
                      totalLoaded,
                      totalProgress: Math.round(
                        (totalLoaded / totalSize) * 100,
                      ),
                    });
                  },
                },
              ),
          ),
        { concurrency: 6 },
      ),
    ),
    Micro.provideService(FetchContext, window.fetch),
  );
};
