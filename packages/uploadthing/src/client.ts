import * as Arr from "effect/Array";
import * as Cause from "effect/Cause";
import * as Console from "effect/Console";
import * as Effect from "effect/Effect";
import { unsafeCoerce } from "effect/Function";
import * as Runtime from "effect/Runtime";

import type { ExpandedRouteConfig } from "@uploadthing/shared";
import {
  FetchContext,
  fileSizeToBytes,
  getTypeFromFileName,
  objectKeys,
  resolveMaybeUrlArg,
  UploadThingError,
} from "@uploadthing/shared";

import * as pkgJson from "../package.json";
import { UPLOADTHING_VERSION } from "./internal/constants";
import type { FileRouter, inferEndpointOutput } from "./internal/types";
import { uploadWithProgress } from "./internal/upload.browser";
import { createUTReporter } from "./internal/ut-reporter";
import type {
  ClientUploadedFileData,
  GenerateUploaderOptions,
  inferEndpointInput,
  NewPresignedUrl,
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
} from "@uploadthing/shared";

/**
 * Validate that a file is of a valid type given a route config
 * @public
 */
export const isValidFileType = (
  file: File,
  routeConfig: ExpandedRouteConfig,
): boolean =>
  Effect.runSync(
    getTypeFromFileName(file.name, objectKeys(routeConfig)).pipe(
      Effect.flatMap((type) => Effect.succeed(file.type.includes(type))),
      Effect.catchAll(() => Effect.succeed(false)),
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
  Effect.runSync(
    getTypeFromFileName(file.name, objectKeys(routeConfig)).pipe(
      Effect.flatMap((type) => fileSizeToBytes(routeConfig[type]!.maxFileSize)),
      Effect.flatMap((maxFileSize) => Effect.succeed(file.size <= maxFileSize)),
      Effect.catchAll(() => Effect.succeed(false)),
    ),
  );

/**
 * Generate a typed `uploadFiles` function for your FileRouter
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
        Effect.provideService(FetchContext, {
          fetch: globalThis.fetch.bind(globalThis),
          baseHeaders: {
            "x-uploadthing-version": UPLOADTHING_VERSION,
            "x-uploadthing-api-key": undefined,
            "x-uploadthing-fe-package": initOpts.package,
            "x-uploadthing-be-adapter": undefined,
          },
        }),
        Effect.runPromise,
      )
      .catch((error) => {
        if (!Runtime.isFiberFailure(error)) throw error;
        throw Cause.squash(error[Runtime.FiberFailureCauseId]);
      });
};

/***
 * INTERNALS
 *   VVV
 */

const uploadFilesInternal = <
  TRouter extends FileRouter,
  TEndpoint extends keyof TRouter,
  TServerOutput = inferEndpointOutput<TRouter[TEndpoint]>,
>(
  endpoint: TEndpoint,
  opts: UploadFilesOptions<TRouter, TEndpoint>,
): Effect.Effect<
  ClientUploadedFileData<TServerOutput>[],
  UploadThingError,
  FetchContext
> => {
  // classic service right here
  const reportEventToUT = createUTReporter({
    endpoint: String(endpoint),
    package: opts.package,
    url: resolveMaybeUrlArg(opts.url),
    headers: opts.headers,
  });

  return Effect.flatMap(
    reportEventToUT("upload", {
      input: "input" in opts ? opts.input : null,
      files: opts.files.map((f) => ({
        name: f.name,
        size: f.size,
        type: f.type,
      })),
    }),
    ({ presigneds, routeOptions }) =>
      Effect.forEach(
        presigneds,
        (presigned) =>
          uploadFile<TRouter, TEndpoint, TServerOutput>(opts, presigned),
        { concurrency: 6 },
      ),
  );
};

const uploadFile = <
  TRouter extends FileRouter,
  TEndpoint extends keyof TRouter,
  TServerOutput = inferEndpointOutput<TRouter[TEndpoint]>,
>(
  opts: UploadFilesOptions<TRouter, TEndpoint>,
  presigned: NewPresignedUrl,
) =>
  Arr.findFirst(opts.files, (file) => file.name === presigned.name).pipe(
    Effect.tapError(() =>
      Console.error("No file found for presigned URL", presigned),
    ),
    Effect.mapError(
      () =>
        new UploadThingError({
          code: "NOT_FOUND",
          message: "No file found for presigned URL",
          cause: `No file matching '${presigned}' found in ${opts.files.map((f) => f.name).join(",")}`,
        }),
    ),
    Effect.tap((file) => opts.onUploadBegin?.({ file: file.name })),
    Effect.andThen((file) =>
      uploadWithProgress(file, presigned, opts.onUploadProgress).pipe(
        Effect.map(unsafeCoerce<unknown, TServerOutput>),
        Effect.flatMap((serverData) =>
          Effect.succeed({
            name: file.name,
            size: file.size,
            key: presigned.key,
            serverData,
            url: "https://utfs.io/f/" + presigned.key,
            customId: presigned.customId,
            type: file.type,
          }),
        ),
      ),
    ),
  );
