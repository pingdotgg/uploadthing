import * as Arr from "effect/Array";
import { unsafeCoerce } from "effect/Function";
import * as Micro from "effect/Micro";
import * as Option from "effect/Option";

import type {
  ExpandedRouteConfig,
  FetchError,
  InvalidJsonError,
  RouteOptions,
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
import type { MPUResponse, PSPResponse } from "./internal/shared-schemas";
import type { FileRouter, inferEndpointOutput } from "./internal/types";
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
  return <TEndpoint extends keyof TRouter>(
    endpoint: TEndpoint,
    opts: Omit<
      UploadFilesOptions<TRouter, TEndpoint>,
      keyof GenerateUploaderOptions
    >,
  ) =>
    uploadFilesInternal<TRouter, TEndpoint>(endpoint, {
      ...opts,
      skipPolling: {} as never, // Remove in a future version, it's type right not is an ErrorMessage<T> to help migrations.
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
          Micro.runPromiseResult(e, opts.signal ? { signal: opts.signal } : {}),
      )
      .then((result) => {
        if (result._tag === "Right") {
          return result.right;
        } else if (result.left._tag === "Aborted") {
          throw new UploadAbortedError();
        }
        throw Micro.failureSquash(result.left);
      });
};

const uploadFilesInternal = <
  TRouter extends FileRouter,
  TEndpoint extends keyof TRouter,
  TServerOutput = inferEndpointOutput<TRouter[TEndpoint]>,
>(
  endpoint: TEndpoint,
  opts: UploadFilesOptions<TRouter, TEndpoint>,
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
    Micro.flatMap(({ presigneds, routeOptions }) =>
      Micro.forEach(
        presigneds,
        (presigned) =>
          uploadFile<TRouter, TEndpoint, TServerOutput>(
            String(endpoint),
            { ...opts, reportEventToUT, routeOptions },
            presigned,
          ).pipe(
            Micro.onAbort(
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
  if (input.status === "done") return "file" in input && isObject(input.file);
  return input.status === "not done";
};

const isPollingDone = (input: PollingResponse): input is Done => {
  return input.status === "done" && "callbackData" in input;
};

const uploadFile = <
  TRouter extends FileRouter,
  TEndpoint extends keyof TRouter,
  TServerOutput = inferEndpointOutput<TRouter[TEndpoint]>,
>(
  slug: string,
  opts: UploadFilesOptions<TRouter, TEndpoint> & {
    reportEventToUT: UTReporter;
    routeOptions: RouteOptions;
  },
  presigned: MPUResponse | PSPResponse,
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
        Micro.filterOrFailWith(isPollingResponse, (_) =>
          Micro.FailureUnexpected(
            "received a non PollingResponse from the polling endpoint",
          ),
        ),
        Micro.filterOrFail(isPollingDone, () => new RetryError()),
        Micro.map(({ callbackData }) => callbackData),
        Micro.retry({
          while: (res) => res instanceof RetryError,
          delay: exponentialDelay(),
        }),
        Micro.when(() => !!opts.routeOptions.awaitServerData),
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
