import * as S from "@effect/schema/Schema";
import * as Effect from "effect/Effect";

import {
  FetchContext,
  fetchEffJson,
  fillInputRouteConfig,
  generateUploadThingURL,
  objectKeys,
  parseRequestJson,
  UploadThingError,
  verifySignature,
} from "@uploadthing/shared";

import { UPLOADTHING_VERSION } from "./constants";
import { conditionalDevServer } from "./dev-hook";
import { ConsolaLogger, withMinimalLogLevel } from "./logger";
import {
  abortMultipartUpload,
  completeMultipartUpload,
} from "./multi-part.server";
import { getParseFn } from "./parser";
import { resolveCallbackUrl } from "./resolve-url";
import {
  FailureActionPayload,
  MultipartCompleteActionPayload,
  PresignedURLResponseSchema,
  ServerCallbackPostResponseSchema,
  UploadActionPayload,
  UploadedFileDataSchema,
} from "./shared-schemas";
import type {
  FileRouter,
  MiddlewareFnArgs,
  RequestHandler,
  RequestHandlerInput,
  RequestHandlerOutput,
  RequestHandlerSuccess,
  RouteHandlerConfig,
  RouteHandlerOptions,
  UTEvents,
  ValidMiddlewareObject,
} from "./types";
import { UTFiles } from "./types";
import {
  assertFilesMeetConfig,
  parseAndValidateRequest,
  RequestInput,
} from "./validate-request-input";

/**
 * Allows adapters to be fully async/await instead of providing services and running Effect programs
 */
export const runRequestHandlerAsync = <
  TArgs extends MiddlewareFnArgs<any, any, any>,
>(
  handler: RequestHandler<TArgs>,
  args: RequestHandlerInput<TArgs>,
  config?: RouteHandlerConfig | undefined,
) =>
  handler(args).pipe(
    withMinimalLogLevel(config?.logLevel),
    Effect.provide(ConsolaLogger),
    Effect.provideService(FetchContext, {
      fetch: config?.fetch ?? globalThis.fetch,
      baseHeaders: {
        "x-uploadthing-version": UPLOADTHING_VERSION,
        // These are filled in later in `parseAndValidateRequest`
        "x-uploadthing-api-key": undefined,
        "x-uploadthing-be-adapter": undefined,
        "x-uploadthing-fe-package": undefined,
      },
    }),
    asHandlerOutput,
    Effect.runPromise,
  );

const asHandlerOutput = <R>(
  effect: Effect.Effect<RequestHandlerSuccess, UploadThingError, R>,
): Effect.Effect<RequestHandlerOutput, never, R> =>
  Effect.catchAll(effect, (error) => Effect.succeed({ success: false, error }));

const handleRequest = RequestInput.pipe(
  Effect.andThen(({ action, hook }) => {
    if (hook === "callback") return handleCallbackRequest;
    switch (action) {
      case "upload":
        return handleUploadAction;
      case "multipart-complete":
        return handleMultipartCompleteAction;
      case "failure":
        return handleMultipartFailureAction;
    }
  }),
  Effect.map((output): RequestHandlerSuccess => ({ success: true, ...output })),
);

export const buildRequestHandler =
  <TRouter extends FileRouter, Args extends MiddlewareFnArgs<any, any, any>>(
    opts: RouteHandlerOptions<TRouter>,
    adapter: string,
  ): RequestHandler<Args> =>
  (input) =>
    handleRequest.pipe(
      Effect.provideServiceEffect(
        RequestInput,
        parseAndValidateRequest(input, opts, adapter),
      ),
      Effect.catchTags({
        BadRequestError: (e) =>
          Effect.fail(
            new UploadThingError({
              code: "INTERNAL_SERVER_ERROR",
              message: e.getMessage(),
              cause: e,
              data: e.error as never,
            }),
          ),
        FetchError: (e) =>
          new UploadThingError({
            code: "INTERNAL_SERVER_ERROR",
            message: typeof e.error === "string" ? e.error : e.message,
            cause: e,
            data: e.error as never,
          }),
        ParseError: (e) =>
          new UploadThingError({
            code: "INTERNAL_SERVER_ERROR",
            message: "An error occured while parsing input/output",
            cause: e,
          }),
      }),
      Effect.tapError((e) => Effect.logError(e.message)),
    );

const handleCallbackRequest = Effect.gen(function* () {
  const { req, uploadable, apiKey } = yield* RequestInput;
  const verified = yield* Effect.tryPromise({
    try: async () =>
      verifySignature(
        await req.clone().text(),
        req.headers.get("x-uploadthing-signature"),
        apiKey,
      ),
    catch: () =>
      new UploadThingError({
        code: "BAD_REQUEST",
        message: "Invalid signature",
      }),
  });
  yield* Effect.logDebug("Signature verified:", verified);
  if (!verified) {
    yield* Effect.logError("Invalid signature");
    return yield* new UploadThingError({
      code: "BAD_REQUEST",
      message: "Invalid signature",
    });
  }

  const requestInput = yield* parseRequestJson(
    req,
    S.Struct({
      status: S.String,
      file: UploadedFileDataSchema,
      metadata: S.Record(S.String, S.Unknown),
    }),
  );
  yield* Effect.logDebug("Handling callback request with input:", requestInput);

  const serverData = yield* Effect.tryPromise({
    try: async () =>
      uploadable.resolver({
        file: requestInput.file,
        metadata: requestInput.metadata,
      }) as Promise<unknown>,
    catch: (error) =>
      new UploadThingError({
        code: "INTERNAL_SERVER_ERROR",
        message: "Failed to run onUploadComplete",
        cause: error,
      }),
  }).pipe(
    Effect.tapError((error) =>
      Effect.logError(
        "Failed to run onUploadComplete. You probably shouldn't be throwing errors here.",
        error,
      ),
    ),
  );
  const payload = {
    fileKey: requestInput.file.key,
    callbackData: serverData ?? null,
  };
  yield* Effect.logDebug(
    "'onUploadComplete' callback finished. Sending response to UploadThing:",
    payload,
  );

  yield* fetchEffJson(
    generateUploadThingURL("/api/serverCallback"),
    ServerCallbackPostResponseSchema,
    {
      method: "POST",
      body: JSON.stringify(payload),
      headers: { "Content-Type": "application/json" },
    },
  );
  return { body: null };
});

const runRouteMiddleware = (opts: S.Schema.Type<typeof UploadActionPayload>) =>
  Effect.gen(function* () {
    const { uploadable, middlewareArgs } = yield* RequestInput;
    const { files, input } = opts;

    yield* Effect.logDebug("Running middleware");
    const metadata: ValidMiddlewareObject = yield* Effect.tryPromise({
      try: async () =>
        uploadable._def.middleware({ ...middlewareArgs, input, files }),
      catch: (error) =>
        error instanceof UploadThingError
          ? error
          : new UploadThingError({
              code: "INTERNAL_SERVER_ERROR",
              message: "Failed to run middleware",
              cause: error,
            }),
    }).pipe(
      Effect.tapError((error) =>
        Effect.logError("An error occured in your middleware function", error),
      ),
    );

    if (metadata[UTFiles] && metadata[UTFiles].length !== files.length) {
      const msg = `Expected files override to have the same length as original files, got ${metadata[UTFiles].length} but expected ${files.length}`;
      yield* Effect.logError(msg);
      return yield* new UploadThingError({
        code: "BAD_REQUEST",
        message: "Files override must have the same length as files",
        cause: msg,
      });
    }

    // Attach customIds from middleware to the files
    const filesWithCustomIds = yield* Effect.forEach(files, (file, idx) =>
      Effect.gen(function* () {
        const theirs = metadata[UTFiles]?.[idx];
        if (theirs && theirs.size !== file.size) {
          yield* Effect.logWarning(
            "File size mismatch. Reverting to original size",
          );
        }
        return {
          name: theirs?.name ?? file.name,
          size: file.size,
          customId: theirs?.customId,
        };
      }),
    );

    return { metadata, filesWithCustomIds };
  });

const handleUploadAction = Effect.gen(function* () {
  const opts = yield* RequestInput;
  const { files, input } = yield* parseRequestJson(
    opts.req,
    UploadActionPayload,
  );
  yield* Effect.logDebug("Handling upload request with input:", {
    files,
    input,
  });

  // validate the input
  yield* Effect.logDebug("Parsing user input");
  const inputParser = opts.uploadable._def.inputParser;
  const parsedInput = yield* Effect.tryPromise({
    try: async () => getParseFn(inputParser)(input),
    catch: (error) =>
      new UploadThingError({
        code: "BAD_REQUEST",
        message: "Invalid input",
        cause: error,
      }),
  }).pipe(
    Effect.tapError((error) =>
      Effect.logError("An error occured trying to parse input", error),
    ),
  );
  yield* Effect.logDebug("Input parsed successfully", parsedInput);

  const { metadata, filesWithCustomIds } = yield* runRouteMiddleware({
    input: parsedInput,
    files,
  });

  yield* Effect.logDebug(
    "Parsing route config",
    opts.uploadable._def.routerConfig,
  );
  const parsedConfig = yield* fillInputRouteConfig(
    opts.uploadable._def.routerConfig,
  ).pipe(
    Effect.catchTag(
      "InvalidRouteConfig",
      (err) =>
        new UploadThingError({
          code: "BAD_REQUEST",
          message: "Invalid config",
          cause: err,
        }),
    ),
  );
  yield* Effect.logDebug("Route config parsed successfully", parsedConfig);

  yield* Effect.logDebug(
    "Validating files meet the config requirements",
    files,
  );
  yield* assertFilesMeetConfig(files, parsedConfig).pipe(
    Effect.catchAll(
      (e) =>
        new UploadThingError({
          code: "BAD_REQUEST",
          message: `Invalid config: ${e._tag}`,
          cause: "reason" in e ? e.reason : e.message,
        }),
    ),
  );

  const callbackUrl = yield* resolveCallbackUrl.pipe(
    Effect.tapError((error) =>
      Effect.logError("Failed to resolve callback URL", error),
    ),
    Effect.catchTag(
      "InvalidURL",
      (err) =>
        new UploadThingError({
          code: "INTERNAL_SERVER_ERROR",
          message: err.message,
        }),
    ),
  );
  yield* Effect.logDebug(
    "Retrieving presigned URLs from UploadThing. Callback URL is:",
    callbackUrl.href,
  );

  const presignedUrls = yield* fetchEffJson(
    generateUploadThingURL("/api/prepareUpload"),
    PresignedURLResponseSchema,
    {
      method: "POST",
      body: JSON.stringify({
        files: filesWithCustomIds,
        routeConfig: parsedConfig,
        metadata,
        callbackUrl: callbackUrl.origin + callbackUrl.pathname,
        callbackSlug: opts.slug,
      }),
      headers: { "Content-Type": "application/json" },
    },
  );

  yield* Effect.logDebug("UploadThing responded with:", presignedUrls);
  yield* Effect.logDebug("Sending presigned URLs to client");

  let promise: Promise<unknown> | undefined = undefined;
  if (opts.isDev) {
    const fetchContext = yield* FetchContext;
    promise = Effect.forEach(
      presignedUrls,
      (file) => conditionalDevServer(file.key, opts.apiKey),
      { concurrency: 10 },
    ).pipe(
      Effect.provide(ConsolaLogger),
      Effect.provideService(FetchContext, fetchContext),
      Effect.runPromise,
    );
  }

  return {
    body: presignedUrls satisfies UTEvents["upload"]["out"],
    cleanup: promise,
  };
});

const handleMultipartCompleteAction = Effect.gen(function* () {
  const opts = yield* RequestInput;
  const requestInput = yield* parseRequestJson(
    opts.req,
    MultipartCompleteActionPayload,
  );

  yield* Effect.logDebug(
    "Handling multipart-complete request with input:",
    requestInput,
  );
  yield* Effect.logDebug(
    "Notifying UploadThing that multipart upload is complete",
  );

  const completionResponse = yield* completeMultipartUpload(
    {
      key: requestInput.fileKey,
      uploadId: requestInput.uploadId,
    },
    requestInput.etags,
  );
  yield* Effect.logDebug("UploadThing responded with:", completionResponse);

  return {
    body: null satisfies UTEvents["multipart-complete"]["out"],
  };
});

const handleMultipartFailureAction = Effect.gen(function* () {
  const { req, uploadable } = yield* RequestInput;
  const { fileKey, uploadId } = yield* parseRequestJson(
    req,
    FailureActionPayload,
  );
  yield* Effect.logDebug("Handling failure request with input:", {
    fileKey,
    uploadId,
  });
  yield* Effect.logDebug("Notifying UploadThing that upload failed");

  const failureResponse = yield* abortMultipartUpload({
    key: fileKey,
    uploadId,
  });
  yield* Effect.logDebug("UploadThing responded with:", failureResponse);
  yield* Effect.logDebug("Running 'onUploadError' callback");

  yield* Effect.try({
    try: () => {
      uploadable._def.onUploadError({
        error: new UploadThingError({
          code: "UPLOAD_FAILED",
          message: `Upload failed for ${fileKey}`,
        }),
        fileKey,
      });
    },
    catch: (error) =>
      new UploadThingError({
        code: "INTERNAL_SERVER_ERROR",
        message: "Failed to run onUploadError",
        cause: error,
      }),
  }).pipe(
    Effect.tapError((error) =>
      Effect.logError(
        "Failed to run onUploadError. You probably shouldn't be throwing errors here.",
        error,
      ),
    ),
  );

  return {
    body: null satisfies UTEvents["failure"]["out"],
  };
});

export const buildPermissionsInfoHandler = <TRouter extends FileRouter>(
  opts: RouteHandlerOptions<TRouter>,
) => {
  return () => {
    const permissions = objectKeys(opts.router).map((slug) => {
      const route = opts.router[slug];
      const config = Effect.runSync(
        fillInputRouteConfig(route._def.routerConfig),
      );
      return {
        slug,
        config,
      };
    });

    return permissions;
  };
};
