/* eslint-disable no-console -- Don't ship our logger to client, reduce size*/

import type { ParseError } from "@effect/schema/ParseResult";
import * as S from "@effect/schema/Schema";
import { Effect, Layer } from "effect";

import type { FetchContextTag, FetchError } from "@uploadthing/shared";
import {
  exponentialBackoff,
  fetchContext,
  fetchEffJson,
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
  generateMimeTypes,
  /** @public */
  generateClientDropzoneAccept,
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
  FetchContextTag
> =>
  Effect.gen(function* ($) {
    const reportEventToUT = createUTReporter({
      endpoint: String(endpoint),
      package: opts.package,
      url: resolveMaybeUrlArg(opts.url),
      headers: opts.headers,
    });

    const presigneds = yield* $(
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
        PresignedURLResponseSchema,
      ),
    );

    return yield* $(
      Effect.forEach(
        presigneds,
        (presigned) =>
          uploadFile(String(endpoint), { ...opts, reportEventToUT }, presigned),
        { concurrency: 6 },
      ),
    );
  });

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
  ) => {
    const layer = Layer.succeed(fetchContext, {
      fetch: globalThis.fetch.bind(globalThis),
      baseHeaders: {
        "x-uploadthing-version": UPLOADTHING_VERSION,
        "x-uploadthing-api-key": undefined,
        "x-uploadthing-fe-package": initOpts.package,
        "x-uploadthing-be-adapter": undefined,
      },
    });

    return uploadFilesInternal<TRouter, TEndpoint, TSkipPolling>(endpoint, {
      ...opts,
      url: resolveMaybeUrlArg(initOpts?.url),
      package: initOpts.package,
      // eslint-disable-next-line @typescript-eslint/no-unsafe-member-access
      input: (opts as any).input as inferEndpointInput<TRouter[TEndpoint]>,
    }).pipe(
      Effect.tapErrorCause(Effect.logError),
      Effect.provide(layer),
      Effect.runPromise,
    );
  };
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
  Effect.gen(function* ($) {
    const file = opts.files.find((f) => f.name === presigned.fileName);

    if (!file) {
      console.error("No file found for presigned URL", presigned);
      return yield* $(
        new UploadThingError({
          code: "NOT_FOUND",
          message: "No file found for presigned URL",
          cause: `Expected file with name ${presigned.fileName} but got '${opts.files.join(",")}'`,
        }),
      );
    }

    opts.onUploadBegin?.({ file: file.name });
    if ("urls" in presigned) {
      yield* $(uploadMultipartWithProgress(file, presigned, opts));
    } else {
      yield* $(uploadPresignedPostWithProgress(file, presigned, opts));
    }

    const PollingResponse = S.union(
      S.struct({
        status: S.literal("done"),
        callbackData: S.any as S.Schema<TServerOutput, any>,
      }),
      S.struct({ status: S.literal("still waiting") }),
    );

    let serverData: TServerOutput | null = null;
    if (!opts.skipPolling) {
      serverData = yield* $(
        fetchEffJson(presigned.pollingUrl, PollingResponse, {
          headers: { authorization: presigned.pollingJwt },
        }),
        Effect.andThen((res) =>
          res.status === "done"
            ? Effect.succeed(res.callbackData)
            : Effect.fail(new RetryError()),
        ),
        Effect.retry({
          while: (res) => res instanceof RetryError,
          schedule: exponentialBackoff,
        }),
      );
    }

    return {
      name: file.name,
      size: file.size,
      key: presigned.key,
      // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment
      serverData: serverData as any,
      url: "https://utfs.io/f/" + presigned.key,
      customId: presigned.customId,
      type: file.type,
    };
  });
