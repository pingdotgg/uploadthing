import * as Arr from "effect/Array";
import { unsafeCoerce } from "effect/Function";
import * as Micro from "effect/Micro";
import * as Option from "effect/Option";

import type {
  ExpandedRouteConfig,
  FetchError,
  InvalidJsonError,
} from "@uploadthing/shared";
import {
  exponentialDelay,
  FetchContext,
  fetchEff,
  fileSizeToBytes,
  getErrorTypeFromStatusCode,
  getTypeFromFileName,
  isObject,
  objectKeys,
  parseResponseJson,
  resolveMaybeUrlArg,
  RetryError,
  UploadAbortedError,
  UploadThingError,
} from "@uploadthing/shared";

import * as pkgJson from "../package.json";
import { UPLOADTHING_VERSION } from "./internal/constants";
import { uploadMultipartWithProgress } from "./internal/multi-part.browser";
import { uploadPresignedPostWithProgress } from "./internal/presigned-post.browser";
import type {
  FileRouter,
  inferEndpointOutput,
  PresignedURLs,
} from "./internal/types";
import type { UTReporter } from "./internal/ut-reporter";
import { createUTReporter } from "./internal/ut-reporter";
import type {
  ClientUploadedFileData,
  GenerateUploaderOptions,
  inferEndpointInput,
  UploadFilesOptions,
} from "./types";

export const version = pkgJson.version;

export {
  /** @public */
  generateClientDropzoneAccept,
  /** @public */
  generateMimeTypes,
  /** @public */
  generatePermittedFileTypes,
  /** @public */
  UploadAbortedError,
} from "@uploadthing/shared";

/**
 * Validate that a file is of a valid type given a route config
 * @public
 */
export const isValidFileType = (
  file: File,
  routeConfig: ExpandedRouteConfig,
): boolean =>
  Micro.runSync(
    getTypeFromFileName(file.name, objectKeys(routeConfig)).pipe(
      Micro.map((type) => file.type.includes(type)),
      Micro.orElseSucceed(() => false),
    ),
  );

/**
 * Validate that a file is of a valid size given a route config
 * @public
 */
export const isValidFileSize = (
  file: File,
  routeConfig: ExpandedRouteConfig,
): boolean =>
  Micro.runSync(
    getTypeFromFileName(file.name, objectKeys(routeConfig)).pipe(
      Micro.flatMap((type) => fileSizeToBytes(routeConfig[type]!.maxFileSize)),
      Micro.map((maxFileSize) => file.size <= maxFileSize),
      Micro.orElseSucceed(() => false),
    ),
  );

/**
 * Generate a typed uploader for a given FileRouter
 * @public
 */
export const genUploader = <TRouter extends FileRouter>(
  initOpts: GenerateUploaderOptions,
) => {
  return <
    TEndpoint extends keyof TRouter,
    TSkipPolling extends boolean = false,
  >(
    endpoint: TEndpoint,
    opts: Omit<
      UploadFilesOptions<TRouter, TEndpoint, TSkipPolling>,
      keyof GenerateUploaderOptions
    >,
  ) =>
    uploadFilesInternal<TRouter, TEndpoint, TSkipPolling>(endpoint, {
      ...opts,
      url: resolveMaybeUrlArg(initOpts?.url),
      package: initOpts.package,
      // eslint-disable-next-line @typescript-eslint/no-unsafe-member-access
      input: (opts as any).input as inferEndpointInput<TRouter[TEndpoint]>,
    })
      .pipe(
        Micro.provideService(FetchContext, {
          fetch: globalThis.fetch.bind(globalThis),
          baseHeaders: {
            "x-uploadthing-version": UPLOADTHING_VERSION,
            "x-uploadthing-api-key": undefined,
            "x-uploadthing-fe-package": initOpts.package,
            "x-uploadthing-be-adapter": undefined,
          },
        }),
        (e) =>
          Micro.runPromiseExit(e, opts.signal ? { signal: opts.signal } : {}),
      )
      .then((exit) => {
        if (exit._tag === "Right") {
          return exit.right;
        } else if (exit.left._tag === "Interrupt") {
          throw new UploadAbortedError();
        }
        throw Micro.causeSquash(exit.left);
      });
};

const uploadFilesInternal = <
  TRouter extends FileRouter,
  TEndpoint extends keyof TRouter,
  TSkipPolling extends boolean = false,
  TServerOutput = false extends TSkipPolling
    ? inferEndpointOutput<TRouter[TEndpoint]>
    : null,
>(
  endpoint: TEndpoint,
  opts: UploadFilesOptions<TRouter, TEndpoint, TSkipPolling>,
): Micro.Micro<
  ClientUploadedFileData<TServerOutput>[],
  // TODO: Handle these errors instead of letting them bubble
  UploadThingError | RetryError | FetchError | InvalidJsonError,
  FetchContext
> => {
  // classic service right here
  const reportEventToUT = createUTReporter({
    endpoint: String(endpoint),
    package: opts.package,
    url: resolveMaybeUrlArg(opts.url),
    headers: opts.headers,
  });

  return reportEventToUT("upload", {
    input: "input" in opts ? opts.input : null,
    files: opts.files.map((f) => ({
      name: f.name,
      size: f.size,
      type: f.type,
    })),
  }).pipe(
    Micro.flatMap((responses) =>
      Micro.forEach(
        responses,
        (presigned) =>
          uploadFile<TRouter, TEndpoint, TSkipPolling, TServerOutput>(
            String(endpoint),
            { ...opts, reportEventToUT },
            presigned,
          ).pipe(
            Micro.onInterrupt(
              reportEventToUT("failure", {
                fileKey: presigned.key,
                uploadId: "uploadId" in presigned ? presigned.uploadId : null,
                fileName: presigned.fileName,
              }).pipe(Micro.ignore),
            ),
          ),
        { concurrency: 6 },
      ),
    ),
  );
};

type Done = { status: "done"; callbackData: unknown };
type StillWaiting = { status: "still waiting" };
type PollingResponse = Done | StillWaiting;

const isPollingResponse = (input: unknown): input is PollingResponse => {
  if (!isObject(input)) return false;
  if (input.status === "done") return "callbackData" in input;
  return input.status === "still waiting";
};

const isPollingDone = (input: PollingResponse): input is Done => {
  return input.status === "done";
};

const uploadFile = <
  TRouter extends FileRouter,
  TEndpoint extends keyof TRouter,
  TSkipPolling extends boolean = false,
  TServerOutput = false extends TSkipPolling
    ? inferEndpointOutput<TRouter[TEndpoint]>
    : null,
>(
  slug: string,
  opts: UploadFilesOptions<TRouter, TEndpoint, TSkipPolling> & {
    reportEventToUT: UTReporter;
  },
  presigned: PresignedURLs[number],
) =>
  Arr.findFirst(opts.files, (file) => file.name === presigned.fileName).pipe(
    Micro.fromOption,
    Micro.mapError(() => {
      // eslint-disable-next-line no-console
      console.error("No file found for presigned URL", presigned);
      return new UploadThingError({
        code: "NOT_FOUND",
        message: "No file found for presigned URL",
        cause: `Expected file with name ${presigned.fileName} but got '${opts.files.join(",")}'`,
      });
    }),
    Micro.tap((file) => opts.onUploadBegin?.({ file: file.name })),
    Micro.tap((file) =>
      "urls" in presigned
        ? uploadMultipartWithProgress(file, presigned, opts)
        : uploadPresignedPostWithProgress(file, presigned, opts),
    ),
    Micro.zip(
      fetchEff(presigned.pollingUrl, {
        headers: { authorization: presigned.pollingJwt },
      }).pipe(
        Micro.flatMap(parseResponseJson),
        Micro.catchTag("BadRequestError", (e) =>
          Micro.fail(
            new UploadThingError({
              code: getErrorTypeFromStatusCode(e.status),
              message: e.message,
              cause: e,
            }),
          ),
        ),
        Micro.filterOrFailCause(isPollingResponse, (_) =>
          Micro.causeDie(
            "received a non PollingResponse from the polling endpoint",
          ),
        ),
        Micro.filterOrFail(isPollingDone, () => new RetryError()),
        Micro.map(({ callbackData }) => callbackData),
        Micro.retry({
          while: (res) => res._tag === "RetryError",
          schedule: exponentialDelay(),
        }),
        Micro.when(() => !opts.skipPolling),
        Micro.map(Option.getOrNull),
        Micro.map(unsafeCoerce<unknown, TServerOutput>),
      ),
    ),
    Micro.map(([file, serverData]) => ({
      name: file.name,
      size: file.size,
      key: presigned.key,
      serverData,
      url: "https://utfs.io/f/" + presigned.key,
      customId: presigned.customId,
      type: file.type,
    })),
  );
