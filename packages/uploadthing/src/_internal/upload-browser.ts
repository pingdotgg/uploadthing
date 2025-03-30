import { unsafeCoerce } from "effect/Function";
import * as Micro from "effect/Micro";
import { hasProperty, isRecord } from "effect/Predicate";

import type { FetchContext, FetchError } from "@uploadthing/shared";
import { fetchEff, UploadThingError } from "@uploadthing/shared";

import { version } from "../../package.json";
import type {
  ClientUploadedFileData,
  FileRouter,
  inferEndpointOutput,
  NewPresignedUrl,
  UploadFilesOptions,
} from "../types";
import { logDeprecationWarning } from "./deprecations";
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
      if (xhr.status >= 200 && xhr.status < 300 && isRecord(xhr.response)) {
        console.log("xhr load event", xhr.response);
        if (hasProperty(xhr.response, "error")) {
          console.log("resume error", "UPLOAD_FAILED", xhr.response);
          resume(
            new UploadThingError({
              code: "UPLOAD_FAILED",
              message: String(xhr.response.error),
              data: xhr.response as never,
            }),
          );
        } else {
          console.log("resume success", xhr.response);
          resume(Micro.succeed(xhr.response));
        }
      } else {
        console.log(
          "resume error",
          "UPLOAD_FAILED",
          xhr.response,
          xhr.status,
          xhr.statusText,
        );
        resume(
          new UploadThingError({
            code: "UPLOAD_FAILED",
            message: `XHR failed ${xhr.status} ${xhr.statusText}`,
            data: xhr.response as never,
          }),
        );
      }
    });

    // Is there a case when the client would throw and
    // ingest server not knowing about it? idts?
    xhr.addEventListener("error", () => {
      console.log("resume error", "UPLOAD_FAILED");
      resume(
        new UploadThingError({
          code: "UPLOAD_FAILED",
        }),
      );
    });

    const formData = new FormData();
    /**
     * iOS/React Native FormData handling requires special attention:
     *
     * Issue: In React Native, iOS crashes with "attempt to insert nil object" when appending File directly
     * to FormData. This happens because iOS tries to create NSDictionary from the file object and expects
     * specific structure {uri, type, name}.
     *
     *
     * Note: Don't try to use Blob or modify File object - iOS specifically needs plain object
     * with these properties to create valid NSDictionary.
     */
    if ("uri" in file) {
      // eslint-disable-next-line @typescript-eslint/no-unsafe-argument
      formData.append("file", {
        uri: file.uri as string,
        type: file.type,
        name: file.name,
        ...(rangeStart > 0 && { range: rangeStart }),
      } as any);
    } else {
      formData.append("file", rangeStart > 0 ? file.slice(rangeStart) : file);
    }

    console.log("formData", formData);
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
    Micro.tap((uploadResponse) => {
      console.log("uploadResponse", uploadResponse);
    }),
    Micro.map(
      (uploadResponse) =>
        ({
          name: file.name,
          size: file.size,
          key: presigned.key,
          lastModified: file.lastModified,
          serverData: uploadResponse.serverData,
          // get url() {
          //   logDeprecationWarning(
          //     "`file.url` is deprecated and will be removed in uploadthing v9. Use `file.ufsUrl` instead.",
          //   );
          //   return uploadResponse.url;
          // },
          // get appUrl() {
          //   logDeprecationWarning(
          //     "`file.appUrl` is deprecated and will be removed in uploadthing v9. Use `file.ufsUrl` instead.",
          //   );
          //   return uploadResponse.appUrl;
          // },
          ufsUrl: uploadResponse.ufsUrl,
          customId: presigned.customId,
          type: file.type,
          fileHash: uploadResponse.fileHash,
        }) as any,
    ),
    Micro.tap((file) => {
      console.log("file 1", file);
    }),
  );

export const uploadFilesInternal = <
  TRouter extends FileRouter,
  TEndpoint extends keyof TRouter,
  TServerOutput = inferEndpointOutput<TRouter[TEndpoint]>,
>(
  endpoint: TEndpoint,
  opts: UploadFilesOptions<TRouter[TEndpoint]>,
): Micro.Micro<
  ClientUploadedFileData<TServerOutput>[],
  UploadThingError | FetchError,
  FetchContext
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

  return Micro.flatMap(
    reportEventToUT("upload", {
      input: "input" in opts ? opts.input : null,
      files: opts.files.map((f) => ({
        name: f.name,
        size: f.size,
        type: f.type,
        lastModified: f.lastModified,
      })),
    }),
    (presigneds) =>
      Micro.forEach(
        presigneds,
        (presigned, i) =>
          Micro.flatMap(
            Micro.sync(() =>
              opts.onUploadBegin?.({ file: opts.files[i]!.name }),
            ),
            () =>
              uploadFile<TRouter, TEndpoint, TServerOutput>(
                opts.files[i]!,
                presigned,
                {
                  onUploadProgress: (ev) => {
                    totalLoaded += ev.delta;
                    opts.onUploadProgress?.({
                      file: opts.files[i]!,
                      progress: (ev.loaded / opts.files[i]!.size) * 100,
                      loaded: ev.loaded,
                      delta: ev.delta,
                      totalLoaded,
                      totalProgress: totalLoaded / totalSize,
                    });
                  },
                },
              ).pipe(
                Micro.tap((file) => {
                  console.log("file 2", file);
                }),
              ),
          ),
        { concurrency: 6 },
      ).pipe(
        Micro.tap((files) => {
          console.log("files", files);
        }),
      ),
  );
};
