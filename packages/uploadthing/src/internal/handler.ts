import {
  HttpBody,
  HttpClient,
  HttpClientRequest,
  HttpClientResponse,
} from "@effect/platform";
import * as S from "@effect/schema/Schema";
import * as Config from "effect/Config";
import * as Effect from "effect/Effect";
import * as Layer from "effect/Layer";
import * as Stream from "effect/Stream";

import {
  fillInputRouteConfig,
  generateKey,
  generateSignedURL,
  getRequestUrl,
  getTypeFromFileName,
  objectKeys,
  parseRequestJson,
  UploadThingError,
  verifySignature,
} from "@uploadthing/shared";

import {
  configProvider,
  ingestUrl,
  isDevelopment,
  UPLOADTHING_VERSION,
  utToken,
} from "./config";
import { ConsolaLogger, withMinimalLogLevel } from "./logger";
import { getParseFn } from "./parser";
import {
  CallbackResultResponse,
  MetadataFetchResponse,
  MetadataFetchStreamPart,
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
) => {
  return handler(args).pipe(
    withMinimalLogLevel,
    Effect.provide(ConsolaLogger),
    Effect.provide(HttpClient.layer),
    Effect.provide(
      Layer.effect(
        HttpClient.Fetch,
        Effect.succeed(config?.fetch as typeof globalThis.fetch),
      ),
    ),
    asHandlerOutput,
    Effect.provide(Layer.setConfigProvider(configProvider(config))),
    Effect.runPromise,
  );
};

const asHandlerOutput = <R>(
  effect: Effect.Effect<RequestHandlerSuccess, UploadThingError, R>,
): Effect.Effect<RequestHandlerOutput, never, R> =>
  Effect.catchAll(effect, (error) => Effect.succeed({ success: false, error }));

const handleRequest = RequestInput.pipe(
  Effect.andThen(({ action, hook }) => {
    if (hook === "callback") return handleCallbackRequest;
    if (action === "upload") return handleUploadAction;
    return Effect.die("Unreachable");
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
        ConfigError: (e) =>
          new UploadThingError({
            code: "INTERNAL_SERVER_ERROR",
            message: "Invalid server configuration",
            cause: e,
          }),
        InvalidURL: (e) =>
          new UploadThingError({
            code: "BAD_REQUEST",
            message:
              "Invalid URL. UploadThing failed to parse the URL. Please provide a URL manually",
            cause: e,
          }),
        InvalidJson: (e) =>
          new UploadThingError({
            code: "INTERNAL_SERVER_ERROR",
            message: "An error occured while parsing input/output",
            cause: e,
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
  const { req, uploadable } = yield* RequestInput;
  const { apiKey } = yield* utToken;
  const verified = yield* verifySignature(
    req.clone().text(),
    req.headers.get("x-uploadthing-signature"),
    apiKey,
  );
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

  /**
   * Run `.onUploadComplete` as a daemon to prevent the
   * request from UT to potentially timeout.
   */
  const fiber = yield* Effect.gen(function* () {
    const serverData = yield* Effect.tryPromise({
      try: async () =>
        uploadable.resolver({
          file: requestInput.file,
          metadata: requestInput.metadata,
        }) as Promise<unknown>,
      catch: (error) =>
        new UploadThingError({
          code: "INTERNAL_SERVER_ERROR",
          message:
            "Failed to run onUploadComplete. You probably shouldn't be throwing errors here.",
          cause: error,
        }),
    });
    const payload = {
      fileKey: requestInput.file.key,
      callbackData: serverData ?? null,
    };
    yield* Effect.logDebug(
      "'onUploadComplete' callback finished. Sending response to UploadThing:",
      payload,
    );

    const httpClient = yield* HttpClient.HttpClient;
    yield* HttpClientRequest.post(`/callback-result`).pipe(
      HttpClientRequest.prependUrl(yield* ingestUrl),
      HttpClientRequest.setHeaders({
        "x-uploadthing-api-key": apiKey,
        "x-uploadthing-version": UPLOADTHING_VERSION,
      }),
      HttpClientRequest.jsonBody(payload),
      Effect.flatMap(HttpClient.filterStatusOk(httpClient)),
      Effect.tapErrorTag("ResponseError", ({ response: res }) =>
        Effect.flatMap(res.json, (json) =>
          Effect.logError(`Failed to register metadata (${res.status})`, json),
        ),
      ),
      HttpClientResponse.schemaBodyJsonScoped(CallbackResultResponse),
      Effect.tap(Effect.log("Sent callback result to UploadThing")),
    );
  }).pipe(Effect.ignoreLogged, Effect.forkDaemon);

  return {
    body: null,
    cleanup: () => Effect.runPromise(fiber.await),
  };
});

const runRouteMiddleware = (opts: S.Schema.Type<typeof UploadActionPayload>) =>
  Effect.gen(function* () {
    const { uploadable, middlewareArgs } = yield* RequestInput;
    const { files, input } = opts;

    yield* Effect.logDebug("Running middleware");
    const metadata = yield* Effect.tryPromise({
      try: async () =>
        uploadable._def.middleware({
          ...middlewareArgs,
          input,
          files,
        }) as Promise<ValidMiddlewareObject>,
      catch: (error) =>
        error instanceof UploadThingError
          ? error
          : new UploadThingError({
              code: "INTERNAL_SERVER_ERROR",
              message: "Failed to run middleware",
              cause: error,
            }),
    });

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
          lastModified: theirs?.lastModified ?? Date.now(),
        };
      }),
    );

    return { metadata, filesWithCustomIds };
  });

const handleUploadAction = Effect.gen(function* () {
  const httpClient = yield* HttpClient.HttpClient;
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
  });
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
          message: "Invalid route config",
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
    Effect.mapError(
      (e) =>
        new UploadThingError({
          code: "BAD_REQUEST",
          message: `Invalid config: ${e._tag}`,
          cause: "reason" in e ? e.reason : e.message,
        }),
    ),
  );

  const fileUploadRequests = yield* Effect.forEach(filesWithCustomIds, (file) =>
    Effect.map(
      getTypeFromFileName(file.name, objectKeys(parsedConfig)),
      (type) => ({
        name: file.name,
        size: file.size,
        type: file.type,
        lastModified: file.lastModified,
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

  const routeOptions = opts.uploadable._def.routeOptions;
  const { apiKey, appId } = yield* utToken;

  const presignedUrls = yield* Effect.forEach(fileUploadRequests, (file) =>
    Effect.gen(function* () {
      const key = yield* generateKey(file, routeOptions.getFileHashParts);

      const url = yield* generateSignedURL(
        `${yield* ingestUrl}/${key}`,
        apiKey,
        {
          ttlInSeconds: routeOptions.presignedURLTTL,
          data: {
            "x-ut-identifier": appId,
            "x-ut-file-name": file.name,
            "x-ut-file-size": file.size,
            "x-ut-file-type": file.type,
            "x-ut-slug": opts.slug,
            "x-ut-custom-id": file.customId,
            "x-ut-content-disposition": file.contentDisposition,
            "x-ut-acl": file.acl,
          },
        },
      );
      return { url, key };
    }),
  );

  const requestUrl = yield* getRequestUrl(opts.req);
  const callbackUrl = yield* Config.string("callbackUrl").pipe(
    Config.withDefault(requestUrl),
  );
  const callbackRequest = HttpClientRequest.post(callbackUrl).pipe(
    HttpClientRequest.appendUrlParam("slug", opts.slug),
    HttpClientRequest.setHeader("uploadthing-hook", "callback"),
  );

  const isDev = yield* isDevelopment;

  const metadataRequest = HttpClientRequest.post("/route-metadata").pipe(
    HttpClientRequest.prependUrl(yield* ingestUrl),
    HttpClientRequest.setHeaders({
      "x-uploadthing-api-key": apiKey,
      "x-uploadthing-version": UPLOADTHING_VERSION,
      "x-uploadthing-be-adapter": opts.adapter,
      "x-uploadthing-fe-package": opts.fePackage,
    }),
    HttpClientRequest.jsonBody({
      fileKeys: presignedUrls.map(({ key }) => key),
      metadata: metadata,
      isDev,
      callbackUrl: callbackRequest.url,
      callbackSlug: opts.slug,
      awaitServerData: routeOptions.awaitServerData ?? false,
    }),
    Effect.flatMap(HttpClient.filterStatusOk(httpClient)),
    Effect.tapErrorTag("ResponseError", ({ response: res }) =>
      Effect.flatMap(res.json, (json) =>
        Effect.logError(`Failed to register metadata (${res.status})`, json),
      ),
    ),
  );

  // Send metadata to UT server (non blocking as a daemon)
  // In dev, keep the stream open and simulate the callback requests as
  // files complete uploading
  const fiber = yield* Effect.if(isDev, {
    onTrue: () =>
      metadataRequest.pipe(
        HttpClientResponse.stream,
        Stream.decodeText(),
        Stream.mapEffect(S.decode(S.parseJson(MetadataFetchStreamPart))),
        Stream.mapEffect(({ payload, signature }) =>
          callbackRequest.pipe(
            HttpClientRequest.setHeader("x-uploadthing-signature", signature),
            HttpClientRequest.setBody(
              HttpBody.text(payload, "application/json"),
            ),
            httpClient,
            HttpClientResponse.arrayBuffer,
            Effect.asVoid,
            Effect.tap(Effect.log("Successfully simulated callback")),
            Effect.ignoreLogged,
          ),
        ),
        Stream.runDrain,
      ),
    onFalse: () =>
      metadataRequest.pipe(
        HttpClientResponse.schemaBodyJsonScoped(MetadataFetchResponse),
      ),
  }).pipe(Effect.ignoreLogged, Effect.forkDaemon);

  const presigneds = presignedUrls.map((p, i) => ({
    url: p.url,
    key: p.key,
    name: fileUploadRequests[i].name,
    customId: fileUploadRequests[i].customId ?? null,
  }));

  yield* Effect.logInfo("Sending presigned URLs to client", presigneds);

  return {
    body: presigneds satisfies UTEvents["upload"]["out"],
    cleanup: () => Effect.runPromise(fiber.await),
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
