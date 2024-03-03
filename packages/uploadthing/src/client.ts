/* eslint-disable no-console -- Don't ship our logger to client, reduce size*/

import * as S from "@effect/schema/Schema";
import { Effect, Layer } from "effect";

import {
  exponentialBackoff,
  fetchContext,
  fetchEffJson,
  RetryError,
  UploadThingError,
} from "@uploadthing/shared";

import * as pkgJson from "../package.json";
import { UPLOADTHING_VERSION } from "./internal/constants";
import { uploadMultipartWithProgress } from "./internal/multi-part.browser";
import { uploadPresignedPostWithProgress } from "./internal/presigned-post.browser";
import { resolveMaybeUrlArg } from "./internal/resolve-url";
import { PresignedURLResponseSchema } from "./internal/shared-schemas";
import type { PresignedURLResponse } from "./internal/shared-schemas";
import type { FileRouter, inferEndpointOutput } from "./internal/types";
import { createAPIRequestUrl, createUTReporter } from "./internal/ut-reporter";
import type {
  GenerateUploaderOptions,
  UploadedFile,
  UploadFilesOptions,
} from "./types";

export {
  /** @public */
  generateMimeTypes,
  /** @public */
  generateClientDropzoneAccept,
} from "@uploadthing/shared";

export const version = pkgJson.version;

const uploadFilesInternal = <
  TRouter extends FileRouter,
  TEndpoint extends keyof TRouter,
  TSkipPolling extends boolean = false,
>(
  endpoint: TEndpoint,
  opts: UploadFilesOptions<TRouter, TEndpoint, TSkipPolling>,
) => {
  const uploadFiles = Effect.gen(function* ($) {
    const presigneds = yield* $(
      fetchEffJson(
        createAPIRequestUrl({
          url: opts.url,
          slug: String(endpoint),
          actionType: "upload",
        }),
        PresignedURLResponseSchema,
        {
          method: "POST",
          body: JSON.stringify({
            input: "input" in opts ? opts.input : null,
            files: opts.files.map((f) => ({ name: f.name, size: f.size })),
          }),
          headers: { "Content-Type": "application/json" },
        },
      ),
    );

    return yield* $(
      Effect.all(
        presigneds.map((presigned) =>
          uploadFile(String(endpoint), opts, presigned),
        ),
      ),
    );
  });

  // TODO: I think this can stay an Effect and not be run as a promise (especially once React package is Effect too)
  //       The `genUploader` can be the one who provides the service and the Promise-inferface for the public
  const layer = Layer.succeed(fetchContext, {
    fetch: globalThis.fetch.bind(globalThis),
    baseHeaders: {
      "x-uploadthing-version": UPLOADTHING_VERSION,
      "x-uploadthing-api-key": undefined,
      "x-uploadthing-fe-package": opts.package,
      "x-uploadthing-be-adapter": undefined,
    },
  });

  return uploadFiles.pipe(
    Effect.tapErrorCause(Effect.logError),
    Effect.provide(layer),
    Effect.runPromise,
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
    // eslint-disable-next-line @typescript-eslint/no-unsafe-argument
    uploadFilesInternal<TRouter, TEndpoint, TSkipPolling>(endpoint, {
      ...opts,
      url: resolveMaybeUrlArg(initOpts?.url),
      package: initOpts.package,
    } as any);
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
  opts: UploadFilesOptions<TRouter, TEndpoint, TSkipPolling>,
  presigned: PresignedURLResponse[number],
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

    const reportEventToUT = createUTReporter({
      url: opts.url,
      endpoint: slug,
      package: opts.package,
    });

    opts.onUploadBegin?.({ file: file.name });
    if ("urls" in presigned) {
      yield* $(
        uploadMultipartWithProgress(file, presigned, {
          reportEventToUT,
          ...opts,
        }),
      );
    } else {
      yield* $(
        uploadPresignedPostWithProgress(file, presigned, {
          reportEventToUT,
          ...opts,
        }),
      );
    }
    // wait a bit as it's unsreasonable to expect the server to be done by now
    // (UT should call user's server, then user's server may do some async work before responding with some data that should be sent back to UT)
    // TODO: We should have an option on the client to opt-out of waiting for server callback  to finish if it doesn't return anything...
    yield* $(Effect.sleep(500));

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

    const ret: UploadedFile<TServerOutput> = {
      name: file.name,
      size: file.size,
      key: presigned.key,
      // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment
      serverData: serverData as any,
      url: "https://utfs.io/f/" + presigned.key,
    };
    return ret;
  });
