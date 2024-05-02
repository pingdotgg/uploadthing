import type { ParseError } from "@effect/schema/ParseResult";
import * as Array from "effect/Array";
import * as Console from "effect/Console";
import * as Effect from "effect/Effect";
import { unsafeCoerce } from "effect/Function";
import * as Option from "effect/Option";
import type * as Predicate from "effect/Predicate";

import type { FetchError } from "@uploadthing/shared";
import {
  exponentialBackoff,
  FetchContext,
  fetchEffUnknown,
  isObject,
  resolveMaybeUrlArg,
  RetryError,
  UploadThingError,
} from "@uploadthing/shared";

import * as pkgJson from "../package.json";
import { UPLOADTHING_VERSION } from "./internal/constants";
import { uploadMultipartWithProgress } from "./internal/multi-part.browser";
import { uploadPresignedPostWithProgress } from "./internal/presigned-post.browser";
import { PresignedURLResponseSchema } from "./internal/shared-schemas";
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

export {
  /** @public */
  generateClientDropzoneAccept,
  /** @public */
  generateMimeTypes,
  /** @public */
  generatePermittedFileTypes,
} from "@uploadthing/shared";

export const version = pkgJson.version;

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
): Effect.Effect<
  ClientUploadedFileData<TServerOutput>[],
  // TODO: Handle these errors instead of letting them bubble
  UploadThingError | RetryError | FetchError | ParseError,
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
    reportEventToUT(
      "upload",
      {
        input: "input" in opts ? opts.input : null,
        files: opts.files.map((f) => ({
          name: f.name,
          size: f.size,
          type: f.type,
        })),
      },
      PresignedURLResponseSchema, // don't want to break this, you do it
    ),
    Effect.forEach(
      (presigned) =>
        uploadFile<TRouter, TEndpoint, TSkipPolling, TServerOutput>(
          String(endpoint),
          { ...opts, reportEventToUT },
          presigned,
        ),
      { concurrency: 6 },
    ),
  );
};

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
    }).pipe(
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

const isPollDone: Predicate.Refinement<PollingResponse, Done> = (
  input,
): input is Done => input.status === "done";

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
  Array.findFirst(opts.files, (file) => file.name === presigned.fileName).pipe(
    Effect.tapError(() =>
      Console.error("No file found for presigned URL", presigned),
    ),
    Effect.mapError(
      () =>
        new UploadThingError({
          code: "NOT_FOUND",
          message: "No file found for presigned URL",
          cause: `Expected file with name ${presigned.fileName} but got '${opts.files.join(",")}'`,
        }),
    ),
    Effect.tap((file) => opts.onUploadBegin?.({ file: file.name })),
    Effect.tap((file) =>
      "urls" in presigned
        ? uploadMultipartWithProgress(file, presigned, opts)
        : uploadPresignedPostWithProgress(file, presigned, opts),
    ),
    Effect.zip(
      fetchEffUnknown(presigned.pollingUrl, {
        headers: { authorization: presigned.pollingJwt },
      }).pipe(
        Effect.filterOrDieMessage(
          isPollingResponse,
          "received a non PollingResponse from the polling endpoint",
        ),
        Effect.filterOrFail(isPollDone, () => new RetryError()),
        Effect.map(({ callbackData }) => callbackData),
        Effect.retry({
          while: (res) => res instanceof RetryError,
          schedule: exponentialBackoff,
        }),
        Effect.when(() => !opts.skipPolling),
        Effect.map(Option.getOrNull),
        Effect.map(unsafeCoerce<unknown, TServerOutput>),
      ),
    ),
    Effect.map(([file, serverData]) => ({
      name: file.name,
      size: file.size,
      key: presigned.key,
      serverData,
      url: "https://utfs.io/f/" + presigned.key,
      customId: presigned.customId,
      type: file.type,
    })),
  );
