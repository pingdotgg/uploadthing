import * as S from "@effect/schema/Schema";
import * as Effect from "effect/Effect";

import {
  FetchContext,
  fetchEff,
  fillInputRouteConfig,
  generateKey,
  generateSignedURL,
  generateUploadThingURL,
  getTypeFromFileName,
  objectKeys,
  parseRequestJson,
  parseResponseJson,
  signPayload,
  UploadThingError,
  verifySignature,
} from "@uploadthing/shared";

import { UPLOADTHING_VERSION } from "./constants";
import { conditionalDevServer } from "./dev-hook";
import { ConsolaLogger, withMinimalLogLevel } from "./logger";
import { getParseFn } from "./parser";
import { resolveCallbackUrl } from "./resolve-url";
import {
  IngestCollectResponse,
  UploadActionPayload,
  UploadedFileData,
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
    }
  }),
  Effect.tap((a) => Effect.logInfo("asHandlerOutput", a)),
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
        InvalidJsonError: (e) =>
          new UploadThingError({
            code: "INTERNAL_SERVER_ERROR",
            message: "An error occured while parsing input/output",
            cause: e,
          }),
        BadRequestError: (e) =>
          Effect.fail(
            new UploadThingError({
              code: "INTERNAL_SERVER_ERROR",
              message: e.getMessage(),
              cause: e,
              data: e.json as never,
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

  const requestInput = yield* Effect.flatMap(
    parseRequestJson(req),
    S.decodeUnknown(
      S.Struct({
        status: S.String,
        file: UploadedFileData,
        metadata: S.Record(S.String, S.Unknown),
      }),
    ),
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

  yield* fetchEff("http://localhost:3001/collect-serverdata", {
    method: "POST",
    body: JSON.stringify(payload),
    headers: { "Content-Type": "application/json" },
  }).pipe(
    Effect.andThen(parseResponseJson),
    Effect.andThen(S.decodeUnknown(IngestCollectResponse)),
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
          type: file.type,
          customId: theirs?.customId,
        };
      }),
    );

    return { metadata, filesWithCustomIds };
  });

const handleUploadAction = Effect.gen(function* () {
  const opts = yield* RequestInput;
  const { files, input } = yield* Effect.flatMap(
    parseRequestJson(opts.req),
    S.decodeUnknown(UploadActionPayload),
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

  const fileUploadRequests = yield* Effect.forEach(filesWithCustomIds, (file) =>
    Effect.map(
      getTypeFromFileName(file.name, objectKeys(parsedConfig)),
      (type) => ({
        name: file.name,
        size: file.size,
        type: file.type,
        customId: file.customId,
        contentDisposition: parsedConfig[type]?.contentDisposition ?? "inline",
        acl: parsedConfig[type]?.acl,
      }),
    ),
  ).pipe(
    Effect.catchTags({
      /** Shouldn't happen since config is validated above so just dying is fine I think */
      InvalidFileType: (e) => Effect.die(e),
      UnknownFileType: (e) => Effect.die(e),
    }),
  );

  const presignedUrls = yield* Effect.forEach(fileUploadRequests, (file) =>
    Effect.promise(() =>
      generateKey(file).then(async (key) => ({
        key,
        url: await generateSignedURL(
          `http://localhost:3001/${key}`,
          opts.apiKey,
          {
            ttlInSeconds: 60 * 60,
            data: {
              "x-ut-identifier": opts.appId,
              "x-ut-file-name": file.name,
              "x-ut-file-size": file.size,
              "x-ut-file-type": file.type,
              "x-ut-slug": opts.slug,
              "x-ut-custom-id": file.customId,
              "x-ut-content-disposition": file.contentDisposition,
              "x-ut-acl": file.acl,
            },
          },
        ),
      })),
    ),
  );

  // const { data: presignedUrls } = yield* fetchEff(
  //   generateUploadThingURL("/v7/prepareUpload"),
  //   {
  //     method: "POST",
  //     body: JSON.stringify({
  //       files: fileUploadRequests,
  //       metadata,
  //       callbackUrl: callbackUrl.origin + callbackUrl.pathname,
  //       callbackSlug: opts.slug,
  //     }),
  //     headers: { "Content-Type": "application/json" },
  //   },
  // ).pipe(
  //   Effect.andThen(parseResponseJson),
  //   Effect.andThen(S.decodeUnknown(PrepareUploadResponse)),
  // );

  yield* Effect.logDebug("UploadThing responded with:", presignedUrls);
  yield* Effect.logDebug("Sending presigned URLs to client");

  // TODO: Do we still need dev hook or should we
  // establish some SSE sort of thing?

  const promises: Array<Promise<unknown>> = [];
  const fetchContext = yield* FetchContext;
  // if (opts.isDev) {
  //   const fetchContext = yield* FetchContext;
  //   promise = Effect.forEach(
  //     presignedUrls,
  //     (presigned) => conditionalDevServer(presigned, opts.apiKey).pipe(Effect.either),
  //     { concurrency: 10 },
  //   ).pipe(
  //     Effect.provide(ConsolaLogger),
  //     Effect.provideService(FetchContext, fetchContext),
  //     Effect.runPromise,
  //   );
  // }

  // Send metadata to UT server (non blocking)
  promises.push(
    Effect.runPromise(
      fetchEff("http://localhost:3001/collect-metadata", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          fileKeys: presignedUrls.map(({ key }) => key),
          metadata: metadata,
          callbackUrl: callbackUrl.origin + callbackUrl.pathname,
          callbackSlug: opts.slug,
          awaitServerData:
            opts.uploadable._def.routeOptions.awaitServerData ?? false,
        }),
      }).pipe(
        Effect.andThen(parseResponseJson),
        Effect.andThen(S.decodeUnknown(IngestCollectResponse)),
        Effect.provide(ConsolaLogger),
        Effect.provideService(FetchContext, fetchContext),
      ),
    ),
  );

  const presigneds = presignedUrls.map((p, i) => ({
    url: p.url,
    key: p.key,
    name: fileUploadRequests[i].name,
    customId: fileUploadRequests[i].customId ?? null,
  }));

  yield* Effect.logInfo("Sending presigned URLs to client", {
    presigneds,
    routeOptions: opts.uploadable._def.routeOptions,
  });

  return {
    body: presigneds satisfies UTEvents["upload"]["out"],
    cleanup: Promise.all(promises),
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
