import * as Array from "effect/Array";
import type { LazyArg } from "effect/Function";
import * as Micro from "effect/Micro";
import * as Predicate from "effect/Predicate";

import { fetchEff } from "@uploadthing/shared";
import type {
  FetchContext,
  FetchError,
  MaybePromise,
} from "@uploadthing/shared";

import { version } from "../../package.json";
import type {
  AnyFileRoute,
  FileRouter as AnyFileRouter,
  NewPresignedUrl,
} from "../types";
import type { UploadPutResult } from "./types";
import { createUTReporter } from "./ut-reporter";

/**
 * Error indicating the XHR request failed
 * @public
 */
export class XHRError extends Micro.TaggedError("XHRError")<{
  message: string;
  xhr: unknown;
}> {}

/**
 * Error indicating the network request failed
 * @public
 */
export type NetworkError = XHRError | FetchError;

/**
 * Error indicating the upload was rejected during upload to the storage provider
 * @public
 */
export class UTStorageError extends Micro.TaggedError("UTStorageError")<{
  message: string;
  response: unknown;
}> {}

/**
 * Error indicating the request to your UploadThing server failed
 * @public
 */
export class UTServerError<TErrorShape> extends Micro.TaggedError(
  "UTServerError",
)<{
  message: string;
  cause: unknown;
  /**
   * Matches the shape returned by your error formatter
   */
  data: TErrorShape;
}> {}

/**
 * Error indicating the upload failed
 * @public
 */
export type UploadThingClientError<TErrorShape> =
  | NetworkError
  | UTStorageError
  | UTServerError<TErrorShape>;

/**
 * A file that has not started uploading yet.
 * Can either be pending for the presigned request to resolve,
 * or pending for the browser to schedule the network request.
 * @public
 */
export interface PendingFile extends File {
  status: "pending";
  /**
   * How many bytes of the file has been uploaded
   * @example 0
   */
  sent: number;
  /**
   * The key of the file. Null before the presigned request resolves.
   */
  key: string | null;
  /**
   * The customId of the file. Null before the presigned request resolves, then present if your file route sets it
   */
  customId: string | null;
}

/**
 * A file that is currently uploading.
 * @public
 */
export interface UploadingFile extends File {
  status: "uploading";
  /**
   * How many bytes of the file has been uploaded
   * @example 2500
   */
  sent: number;
  /**
   * The key of the file.
   */
  key: string;
  /**
   * The customId of the file, if your file route sets it
   */
  customId: string | null;
}

/**
 * A file that failed to upload.
 * @public
 */
export interface FailedFile<TRoute extends AnyFileRoute> extends File {
  status: "failed";
  /**
   * How many bytes of the file were uploaded before the upload failed.
   * @example 2500
   */
  sent: number;
  /**
   * The key of the file.
   */
  key: string;
  /**
   * The customId of the file, if your file route sets it
   */
  customId: string | null;
  /**
   * The error that occurred during the upload.
   */
  reason: UploadThingClientError<TRoute["$types"]["errorShape"]>;
}

/**
 * A file that has been uploaded successfully.
 * @public
 */
export interface UploadedFile<TRoute extends AnyFileRoute> extends File {
  status: "uploaded";
  /**
   * How many bytes of the file has been uploaded.
   * @example 10000
   */
  sent: number;
  /**
   * The key of the file.
   */
  key: string;
  /**
   * The customId of the file, if your file route sets it
   */
  customId: string | null;
  /**
   * The url of the file.
   * @example "https://APP_ID.ufs.sh/f/KEY"
   */
  url: string;
  /**
   * The data returned by the serverside `onUploadComplete` callback.
   * @example { uploadedBy: "user_123" }
   */
  data: TRoute["$types"]["output"];
  /**
   * The hash ( <> checksum ) of the file.
   */
  hash: string;
}

/**
 * A web file with additional state properties
 * @public
 */
export type AnyFile<TFileRoute extends AnyFileRoute> =
  | PendingFile
  | UploadingFile
  | FailedFile<TFileRoute>
  | UploadedFile<TFileRoute>;

/**
 * Predicate function to check if a file is pending
 * @public
 */
export function isPendingFile<TRoute extends AnyFileRoute = AnyFileRoute>(
  file: AnyFile<TRoute>,
): file is PendingFile {
  return file.status === "pending";
}

/**
 * Predicate function to check if a file is uploading
 * @public
 */
export function isUploadingFile<TRoute extends AnyFileRoute = AnyFileRoute>(
  file: AnyFile<TRoute>,
): file is UploadingFile {
  return file.status === "uploading";
}

/**
 * Predicate function to check if a file is failed
 * @public
 */
export function isFailedFile<TRoute extends AnyFileRoute = AnyFileRoute>(
  file: AnyFile<TRoute>,
): file is FailedFile<TRoute> {
  return file.status === "failed";
}

/**
 * Predicate function to check if a file is uploaded
 * @public
 */
export function isUploadedFile<TRoute extends AnyFileRoute = AnyFileRoute>(
  file: AnyFile<TRoute>,
): file is UploadedFile<TRoute> {
  return file.status === "uploaded";
}

/**
 * @internal
 */
export function makePendingFile(file: File): PendingFile {
  return Object.assign(file, {
    status: "pending" as const,
    sent: 0,
    key: null,
    customId: null,
  });
}

/**
 * Modifies a pending file to an uploading file in place
 * @internal
 */
function transitionToUploading(
  file: PendingFile,
  rangeStart: number,
): UploadingFile {
  const uploadingFile = file as unknown as UploadingFile;
  uploadingFile.sent = rangeStart;
  uploadingFile.status = "uploading";
  return uploadingFile;
}

/**
 * Modifies an uploading file to an uploaded file in place
 * @internal
 */
function transitionToUploaded<TRoute extends AnyFileRoute>(
  file: UploadingFile,
  xhrResult: UploadPutResult,
): UploadedFile<TRoute> {
  const uploadedFile = file as unknown as UploadedFile<TRoute>;
  uploadedFile.status = "uploaded";
  uploadedFile.data = xhrResult.serverData;
  uploadedFile.hash = xhrResult.fileHash;
  uploadedFile.url = xhrResult.ufsUrl;
  return uploadedFile;
}

/**
 * Modifies a pending or uploading file to a failed file in place
 * @internal
 */
function transitionToFailed<TRoute extends AnyFileRoute>(
  file: PendingFile | UploadingFile,
  reason: UploadThingClientError<TRoute["$types"]["errorShape"]>,
): FailedFile<TRoute> {
  const failedFile = file as unknown as FailedFile<TRoute>;
  failedFile.status = "failed";
  failedFile.reason = reason;
  return failedFile;
}

/**
 * Event emitted when the presigned URLs have been retrieved from your server
 * @public
 */
export interface PresignedReceivedEvent<TRoute extends AnyFileRoute> {
  type: "presigned-received";
  /**
   * All files that are being uploaded as part of this action.
   */
  files: AnyFile<TRoute>[];
}

/**
 * Event emitted when a file starts uploading
 * @public
 */
export interface UploadStartedEvent<TRoute extends AnyFileRoute> {
  type: "upload-started";
  /**
   * The file that started uploading.
   */
  file: UploadingFile;
  /**
   * All files that are being uploaded as part of this action.
   */
  files: AnyFile<TRoute>[];
}

/**
 * Event emitted when a file is uploading and received a progress update
 * @public
 */
export interface UploadProgressEvent<TRoute extends AnyFileRoute> {
  type: "upload-progress";
  /**
   * The file that is currently uploading and received a progress update.
   */
  file: UploadingFile;
  /**
   * All files that are being uploaded as part of this action.
   */
  files: AnyFile<TRoute>[];
}

/**
 * Event emitted when a file has finished uploading
 * @public
 */
export interface UploadCompletedEvent<TRoute extends AnyFileRoute> {
  type: "upload-completed";
  /**
   * The file that finished uploading.
   */
  file: UploadedFile<TRoute>;
  /**
   * All files that are being uploaded as part of this action.
   */
  files: AnyFile<TRoute>[];
}

/**
 * Event emitted when a file failed to upload
 * @public
 */
export interface UploadFailedEvent<TRoute extends AnyFileRoute> {
  type: "upload-failed";
  /**
   * The file that failed to upload.
   */
  file: FailedFile<TRoute>;
  /**
   * All files that are being uploaded as part of this action.
   */
  files: AnyFile<TRoute>[];
}

/**
 * Event emitted throughout the upload process
 * @public
 */
export type UploadEvent<TRoute extends AnyFileRoute> =
  | PresignedReceivedEvent<TRoute>
  | UploadStartedEvent<TRoute>
  | UploadProgressEvent<TRoute>
  | UploadCompletedEvent<TRoute>
  | UploadFailedEvent<TRoute>;

export interface UploadFileOptions<TRoute extends AnyFileRoute> {
  file: PendingFile;
  files: AnyFile<TRoute>[];
  input: TRoute["$types"]["input"];
  onEvent: (event: UploadEvent<TRoute>) => void;

  XHRImpl: new () => XMLHttpRequest;
}

/**
 * Upload a file to the storage provider
 * Throughout the upload, the file's status and progress will be updated
 * @remarks This function never rejects
 * @internal
 */
export function uploadFile<TRoute extends AnyFileRoute>(
  url: string,
  { file, files, XHRImpl, ...options }: UploadFileOptions<TRoute>,
): Micro.Micro<UploadedFile<TRoute> | FailedFile<TRoute>, never, FetchContext> {
  return fetchEff(url, { method: "HEAD" }).pipe(
    Micro.map(({ headers }) =>
      Number.parseInt(headers.get("x-ut-range-start") ?? "0"),
    ),
    Micro.map((rangeStart) => transitionToUploading(file, rangeStart)),
    Micro.tap((uploadingFile) => {
      options.onEvent({
        type: "upload-started",
        file: uploadingFile,
        files,
      });
    }),
    Micro.flatMap((uploadingFile) =>
      Micro.async<UploadedFile<TRoute>, XHRError | UTStorageError>((resume) => {
        const xhr = new XHRImpl();
        xhr.open("PUT", url, true);

        const rangeStart = uploadingFile.sent;
        xhr.setRequestHeader("Range", `bytes=${rangeStart}-`);
        xhr.setRequestHeader("x-uploadthing-version", version);
        xhr.responseType = "json";

        xhr.upload.addEventListener("progress", (ev) => {
          uploadingFile.sent = rangeStart + ev.loaded;
          options.onEvent({
            type: "upload-progress",
            file: uploadingFile,
            files,
          });
        });
        xhr.addEventListener("load", () => {
          if (
            xhr.status > 299 ||
            Predicate.hasProperty(xhr.response, "error")
          ) {
            resume(
              new UTStorageError({
                // eslint-disable-next-line @typescript-eslint/no-unsafe-member-access
                message: String(xhr.response.error),
                response: xhr.response,
              }),
            );
          } else {
            const uploadedFile = transitionToUploaded<TRoute>(
              uploadingFile,
              xhr.response as UploadPutResult,
            );
            options.onEvent({
              type: "upload-completed",
              file: uploadedFile,
              files,
            });
            resume(Micro.succeed(uploadedFile));
          }
        });
        xhr.addEventListener("error", () => {
          resume(
            new XHRError({
              message: `XHR failed ${xhr.status} ${xhr.statusText}`,
              xhr: xhr,
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
          formData.append(
            "file",
            rangeStart > 0 ? file.slice(rangeStart) : file,
          );
        }
        xhr.send(formData);

        return Micro.sync(() => xhr.abort());
      }),
    ),
    Micro.catchAll((error) => {
      const failedFile = transitionToFailed<TRoute>(file, error);
      options.onEvent({
        type: "upload-failed",
        file: failedFile,
        files,
      });
      return Micro.succeed(failedFile);
    }),
  );
}

export interface RequestPresignedUrlsOptions<
  TRouter extends AnyFileRouter,
  TEndpoint extends keyof TRouter,
> {
  /**
   * The URL to your UploadThing server endpoint
   * @example URL { https://www.example.com/api/uploadthing }
   */
  url: URL;
  /**
   * The slug to your UploadThing FileRoute
   * @example "imageUploader"
   */
  endpoint: TEndpoint;
  /**
   * The files to request presigned URLs for
   */
  files: File[];
  /**
   * The route input for the endpoint
   */
  input?: TRouter[TEndpoint]["$types"]["input"];
  /**
   * Custom headers to send with the request
   * @example { Authorization: "Bearer 123" }
   */
  headers?: HeadersInit | LazyArg<MaybePromise<HeadersInit>> | undefined;
  /**
   * The uploadthing package that is making this request, used to identify the client in the server logs
   * @example "@uploadthing/react"
   */
  package?: string | undefined;
}

/**
 * Request presigned URLs from your server for a set of files
 * @internal
 */
export function requestPresignedUrls<
  TRouter extends AnyFileRouter,
  TEndpoint extends keyof TRouter,
>(
  options: RequestPresignedUrlsOptions<TRouter, TEndpoint>,
): Micro.Micro<
  ReadonlyArray<NewPresignedUrl>,
  UTServerError<TRouter[TEndpoint]["$types"]["errorShape"]>,
  FetchContext
> {
  const reportEventToUT = createUTReporter({
    endpoint: String(options.endpoint),
    package: options.package,
    url: options.url,
    headers: options.headers,
  });

  return reportEventToUT("upload", {
    input: options.input,
    files: options.files.map((f) => ({
      name: f.name,
      size: f.size,
      type: f.type,
      lastModified: f.lastModified,
    })),
  }).pipe(
    Micro.mapError(
      (error) =>
        new UTServerError({
          message: error.message,
          cause: error,
          data: error.data,
        }),
    ),
  );
}

export interface UploadFilesOptions<TRoute extends AnyFileRoute> {
  url: URL;
  files: File[];
  input?: TRoute["$types"]["input"];
  onEvent: (event: UploadEvent<TRoute>) => void;
  headers?: HeadersInit | LazyArg<MaybePromise<HeadersInit>> | undefined;
  package?: string | undefined;
  signal?: AbortSignal | undefined;
}

/**
 * Upload a set of files to the storage provider
 * @internal
 */
export function uploadFiles<
  TRouter extends AnyFileRouter,
  TEndpoint extends keyof TRouter,
>(endpoint: TEndpoint, options: UploadFilesOptions<TRouter[TEndpoint]>) {
  const pendingFiles = options.files.map(makePendingFile);

  return requestPresignedUrls({
    endpoint: endpoint,
    files: options.files,
    url: options.url,
    input: options.input,
    headers: options.headers,
    package: options.package,
  }).pipe(
    Micro.map(Array.zip(pendingFiles)),
    Micro.tap((pairs) => {
      for (const [presigned, file] of pairs) {
        file.key = presigned.key;
        file.customId = presigned.customId;
      }
      options.onEvent({
        type: "presigned-received",
        files: pendingFiles,
      });
    }),
    Micro.flatMap((pairs) =>
      Micro.forEach(
        pairs,
        ([presigned, file]) =>
          uploadFile(presigned.url, {
            file,
            files: pendingFiles,
            input: options.input,
            onEvent: options.onEvent,
            XHRImpl: globalThis.XMLHttpRequest,
          }),
        { concurrency: 6 },
      ),
    ),
  );
}
