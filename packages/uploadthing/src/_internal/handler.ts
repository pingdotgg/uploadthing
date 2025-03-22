import {
  HttpApp,
  HttpBody,
  HttpClient,
  HttpClientRequest,
  HttpClientResponse,
  HttpRouter,
  HttpServerRequest,
  HttpServerResponse,
} from "@effect/platform";
import type { ResponseError } from "@effect/platform/HttpClientError";
import * as Config from "effect/Config";
import * as Context from "effect/Context";
import * as Effect from "effect/Effect";
import * as Match from "effect/Match";
import * as Redacted from "effect/Redacted";
import * as Schema from "effect/Schema";

import {
  fillInputRouteConfig,
  generateKey,
  generateSignedURL,
  getStatusCodeFromError,
  matchFileType,
  objectKeys,
  UploadThingError,
  verifySignature,
} from "@uploadthing/shared";

import * as pkgJson from "../../package.json";
import type { FileRouter, RouteHandlerOptions } from "../types";
import { IngestUrl, IsDevelopment, UTToken } from "./config";
import { logDeprecationWarning } from "./deprecations";
import { formatError } from "./error-formatter";
import { handleJsonLineStream } from "./jsonl";
import { logHttpClientError, logHttpClientResponse } from "./logger";
import { getParseFn } from "./parser";
import { assertFilesMeetConfig, extractRouterConfig } from "./route-config";
import { makeRuntime } from "./runtime";
import {
  ActionType,
  CallbackResultResponse,
  MetadataFetchResponse,
  MetadataFetchStreamPart,
  UploadActionPayload,
  UploadedFileData,
  UploadThingHook,
} from "./shared-schemas";
import { UTFiles } from "./types";
import type { AnyFileRoute, UTEvents } from "./types";

export class AdapterArguments extends Context.Tag(
  "uploadthing/AdapterArguments",
)<AdapterArguments, Record<string, unknown>>() {}

/**
 * Create a request handler adapter for any framework or server library.
 * Refer to the existing adapters for examples on how to use this function.
 * @public
 *
 * @param makeAdapterArgs - Function that takes the args from your framework and returns an Effect that resolves to the adapter args.
 * These args are passed to the `.middleware`, `.onUploadComplete`, and `.onUploadError` hooks.
 * @param toRequest - Function that takes the args from your framework and returns an Effect that resolves to a web Request object.
 * @param opts - The router config and other options that are normally passed to `createRequestHandler` of official adapters
 * @param beAdapter - [Optional] The adapter name of the adapter, used for telemetry purposes
 * @returns A function that takes the args from your framework and returns a promise that resolves to a Response object.
 */
export const makeAdapterHandler = <
  Args extends any[],
  AdapterArgs extends Record<string, unknown>,
>(
  makeAdapterArgs: (...args: Args) => Effect.Effect<AdapterArgs>,
  toRequest: (...args: Args) => Effect.Effect<Request>,
  opts: RouteHandlerOptions<FileRouter>,
  beAdapter?: string,
): ((...args: Args) => Promise<Response>) => {
  const managed = makeRuntime(
    opts.config?.fetch as typeof globalThis.fetch,
    opts.config,
  );
  const handle = Effect.promise(() =>
    managed.runtime().then(HttpApp.toWebHandlerRuntime),
  );

  const app = (...args: Args) =>
    Effect.map(
      Effect.promise(() =>
        managed.runPromise(createRequestHandler(opts, beAdapter ?? "custom")),
      ),
      Effect.provideServiceEffect(AdapterArguments, makeAdapterArgs(...args)),
    );

  return async (...args: Args) => {
    const result = await handle.pipe(
      Effect.ap(app(...args)),
      Effect.ap(toRequest(...args)),
      Effect.withLogSpan("requestHandler"),
      managed.runPromise,
    );

    return result;
  };
};

export const createRequestHandler = <TRouter extends FileRouter>(
  opts: RouteHandlerOptions<TRouter>,
  beAdapter: string,
) =>
  Effect.gen(function* () {
    const isDevelopment = yield* IsDevelopment;
    const routerConfig = yield* extractRouterConfig(opts.router);

    const handleDaemon = (() => {
      if (opts.config?.handleDaemonPromise) {
        return opts.config.handleDaemonPromise;
      }
      return isDevelopment ? "void" : "await";
    })();
    if (isDevelopment && handleDaemon === "await") {
      return yield* new UploadThingError({
        code: "INVALID_SERVER_CONFIG",
        message: 'handleDaemonPromise: "await" is forbidden in development.',
      });
    }

    const GET = Effect.gen(function* () {
      return yield* HttpServerResponse.json(routerConfig);
    });

    const POST = Effect.gen(function* () {
      const {
        "uploadthing-hook": uploadthingHook,
        "x-uploadthing-package": fePackage,
        "x-uploadthing-version": clientVersion,
      } = yield* HttpServerRequest.schemaHeaders(
        Schema.Struct({
          "uploadthing-hook": UploadThingHook.pipe(Schema.optional),
          "x-uploadthing-package": Schema.String.pipe(
            Schema.optionalWith({ default: () => "unknown" }),
          ),
          "x-uploadthing-version": Schema.String.pipe(
            Schema.optionalWith({ default: () => pkgJson.version }),
          ),
        }),
      );

      if (clientVersion !== pkgJson.version) {
        const serverVersion = pkgJson.version;
        yield* Effect.logWarning(
          "Client version mismatch. Things may not work as expected, please sync your versions to ensure compatibility.",
        ).pipe(Effect.annotateLogs({ clientVersion, serverVersion }));
      }

      const { slug, actionType } = yield* HttpRouter.schemaParams(
        Schema.Struct({
          actionType: ActionType.pipe(Schema.optional),
          slug: Schema.String,
        }),
      );

      const uploadable = opts.router[slug];
      if (!uploadable) {
        const msg = `No file route found for slug ${slug}`;
        yield* Effect.logError(msg);
        return yield* new UploadThingError({
          code: "NOT_FOUND",
          message: msg,
        });
      }

      const { body, fiber } = yield* Match.value({
        actionType,
        uploadthingHook,
      }).pipe(
        Match.when({ actionType: "upload", uploadthingHook: undefined }, () =>
          handleUploadAction({
            uploadable,
            fePackage,
            beAdapter,
            slug,
          }),
        ),
        Match.when({ actionType: undefined, uploadthingHook: "callback" }, () =>
          handleCallbackRequest({ uploadable, fePackage, beAdapter }),
        ),
        Match.when({ actionType: undefined, uploadthingHook: "error" }, () =>
          handleErrorRequest({ uploadable }),
        ),
        Match.orElse(() => Effect.succeed({ body: null, fiber: null })),
      );

      if (fiber) {
        yield* Effect.logDebug("Running fiber as daemon").pipe(
          Effect.annotateLogs("handleDaemon", handleDaemon),
        );
        if (handleDaemon === "void") {
          // noop
        } else if (handleDaemon === "await") {
          yield* fiber.await;
        } else if (typeof handleDaemon === "function") {
          handleDaemon(Effect.runPromise(fiber.await));
        }
      }

      yield* Effect.logDebug("Sending response").pipe(
        Effect.annotateLogs("body", body),
      );

      return yield* HttpServerResponse.json(body);
    }).pipe(
      Effect.catchTags({
        ParseError: (e) =>
          HttpServerResponse.json(
            formatError(
              new UploadThingError({
                code: "BAD_REQUEST",
                message: "Invalid input",
                cause: e.message,
              }),
              opts.router,
            ),
            { status: 400 },
          ),
        UploadThingError: (e) =>
          // eslint-disable-next-line @typescript-eslint/no-unsafe-argument
          HttpServerResponse.json(formatError(e, opts.router), {
            status: getStatusCodeFromError(e),
          }),
      }),
    );

    const appendResponseHeaders = Effect.map(
      HttpServerResponse.setHeader("x-uploadthing-version", pkgJson.version),
    );

    return HttpRouter.empty.pipe(
      HttpRouter.get("*", GET),
      HttpRouter.post("*", POST),
      HttpRouter.use(appendResponseHeaders),
    );
  }).pipe(Effect.withLogSpan("createRequestHandler"));

const handleErrorRequest = (opts: { uploadable: AnyFileRoute }) =>
  Effect.gen(function* () {
    const { uploadable } = opts;
    const request = yield* HttpServerRequest.HttpServerRequest;
    const { apiKey } = yield* UTToken;
    const verified = yield* verifySignature(
      yield* request.text,
      request.headers["x-uploadthing-signature"] ?? null,
      apiKey,
    );
    yield* Effect.logDebug(`Signature verified: ${verified}`);
    if (!verified) {
      yield* Effect.logError("Invalid signature");
      return yield* new UploadThingError({
        code: "BAD_REQUEST",
        message: "Invalid signature",
      });
    }

    const requestInput = yield* HttpServerRequest.schemaBodyJson(
      Schema.Struct({
        fileKey: Schema.String,
        error: Schema.String,
      }),
    );
    yield* Effect.logDebug("Handling error callback request with input:").pipe(
      Effect.annotateLogs("json", requestInput),
    );

    const adapterArgs = yield* AdapterArguments;
    const fiber = yield* Effect.tryPromise({
      try: async () =>
        uploadable.onUploadError({
          ...adapterArgs,
          error: new UploadThingError({
            code: "UPLOAD_FAILED",
            message: `Upload failed for ${requestInput.fileKey}: ${requestInput.error}`,
          }),
          fileKey: requestInput.fileKey,
        }),
      catch: (error) =>
        new UploadThingError({
          code: "INTERNAL_SERVER_ERROR",
          message: "Failed to run onUploadError",
          cause: error,
        }),
    })
      .pipe(
        Effect.tapError((error) =>
          Effect.logError(
            "Failed to run onUploadError. You probably shouldn't be throwing errors here.",
          ).pipe(Effect.annotateLogs("error", error)),
        ),
      )
      .pipe(Effect.ignoreLogged, Effect.forkDaemon);

    return {
      body: null,
      fiber,
    };
  }).pipe(Effect.withLogSpan("handleErrorRequest"));

const handleCallbackRequest = (opts: {
  uploadable: AnyFileRoute;
  fePackage: string;
  beAdapter: string;
}) =>
  Effect.gen(function* () {
    const { uploadable, fePackage, beAdapter } = opts;
    const request = yield* HttpServerRequest.HttpServerRequest;
    const { apiKey } = yield* UTToken;
    const verified = yield* verifySignature(
      yield* request.text,
      request.headers["x-uploadthing-signature"] ?? null,
      apiKey,
    );
    yield* Effect.logDebug(`Signature verified: ${verified}`);
    if (!verified) {
      yield* Effect.logError("Invalid signature");
      return yield* new UploadThingError({
        code: "BAD_REQUEST",
        message: "Invalid signature",
      });
    }

    const requestInput = yield* HttpServerRequest.schemaBodyJson(
      Schema.Struct({
        status: Schema.String,
        file: UploadedFileData,
        metadata: Schema.Record({ key: Schema.String, value: Schema.Unknown }),
      }),
    );
    yield* Effect.logDebug("Handling callback request with input:").pipe(
      Effect.annotateLogs("json", requestInput),
    );

    /**
     * Run `.onUploadComplete` as a daemon to prevent the
     * request from UT to potentially timeout.
     */
    const fiber = yield* Effect.gen(function* () {
      const adapterArgs = yield* AdapterArguments;
      const serverData = yield* Effect.tryPromise({
        try: async () =>
          uploadable.onUploadComplete({
            ...adapterArgs,
            file: {
              ...requestInput.file,
              get url() {
                logDeprecationWarning(
                  "`file.url` is deprecated and will be removed in uploadthing v9. Use `file.ufsUrl` instead.",
                );
                return requestInput.file.url;
              },
              get appUrl() {
                logDeprecationWarning(
                  "`file.appUrl` is deprecated and will be removed in uploadthing v9. Use `file.ufsUrl` instead.",
                );
                return requestInput.file.appUrl;
              },
            },
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
      ).pipe(Effect.annotateLogs("callbackData", payload));

      const baseUrl = yield* IngestUrl;

      const httpClient = (yield* HttpClient.HttpClient).pipe(
        HttpClient.filterStatusOk,
      );

      yield* HttpClientRequest.post(`/callback-result`).pipe(
        HttpClientRequest.prependUrl(baseUrl),
        HttpClientRequest.setHeaders({
          "x-uploadthing-api-key": Redacted.value(apiKey),
          "x-uploadthing-version": pkgJson.version,
          "x-uploadthing-be-adapter": beAdapter,
          "x-uploadthing-fe-package": fePackage,
        }),
        HttpClientRequest.bodyJson(payload),
        Effect.flatMap(httpClient.execute),
        Effect.tapError(
          logHttpClientError("Failed to register callback result"),
        ),
        Effect.flatMap(
          HttpClientResponse.schemaBodyJson(CallbackResultResponse),
        ),
        Effect.tap(Effect.log("Sent callback result to UploadThing")),
        Effect.scoped,
      );
    }).pipe(Effect.ignoreLogged, Effect.forkDaemon);

    return { body: null, fiber };
  }).pipe(Effect.withLogSpan("handleCallbackRequest"));

const runRouteMiddleware = (opts: {
  json: typeof UploadActionPayload.Type;
  uploadable: AnyFileRoute;
}) =>
  Effect.gen(function* () {
    const {
      json: { files, input },
      uploadable,
    } = opts;

    yield* Effect.logDebug("Running middleware");
    const adapterArgs = yield* AdapterArguments;
    const metadata = yield* Effect.tryPromise({
      try: async () =>
        uploadable.middleware({
          ...adapterArgs,
          input,
          files,
        }),
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
  }).pipe(Effect.withLogSpan("runRouteMiddleware"));

const handleUploadAction = (opts: {
  uploadable: AnyFileRoute;
  fePackage: string;
  beAdapter: string;
  slug: string;
}) =>
  Effect.gen(function* () {
    const httpClient = (yield* HttpClient.HttpClient).pipe(
      HttpClient.filterStatusOk,
    );
    const { uploadable, fePackage, beAdapter, slug } = opts;
    const json = yield* HttpServerRequest.schemaBodyJson(UploadActionPayload);
    yield* Effect.logDebug("Handling upload request").pipe(
      Effect.annotateLogs("json", json),
    );

    // validate the input
    yield* Effect.logDebug("Parsing user input");
    const parsedInput = yield* Effect.tryPromise({
      try: () => getParseFn(uploadable.inputParser)(json.input),
      catch: (error) =>
        new UploadThingError({
          code: "BAD_REQUEST",
          message: "Invalid input",
          cause: error,
        }),
    });
    yield* Effect.logDebug("Input parsed successfully").pipe(
      Effect.annotateLogs("input", parsedInput),
    );

    const { metadata, filesWithCustomIds } = yield* runRouteMiddleware({
      json: { input: parsedInput, files: json.files },
      uploadable,
    });

    yield* Effect.logDebug("Parsing route config").pipe(
      Effect.annotateLogs("routerConfig", uploadable.routerConfig),
    );
    const parsedConfig = yield* fillInputRouteConfig(
      uploadable.routerConfig,
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
    yield* Effect.logDebug("Route config parsed successfully").pipe(
      Effect.annotateLogs("routeConfig", parsedConfig),
    );

    yield* Effect.logDebug(
      "Validating files meet the config requirements",
    ).pipe(Effect.annotateLogs("files", json.files));
    yield* assertFilesMeetConfig(json.files, parsedConfig).pipe(
      Effect.mapError(
        (e) =>
          new UploadThingError({
            code: "BAD_REQUEST",
            message: `Invalid config: ${e._tag}`,
            cause: "reason" in e ? e.reason : e.message,
          }),
      ),
    );
    yield* Effect.logDebug("Files validated.");

    const fileUploadRequests = yield* Effect.forEach(
      filesWithCustomIds,
      (file) =>
        Effect.map(matchFileType(file, objectKeys(parsedConfig)), (type) => ({
          name: file.name,
          size: file.size,
          type: file.type || type,
          lastModified: file.lastModified,
          customId: file.customId,
          contentDisposition:
            parsedConfig[type]?.contentDisposition ?? "inline",
          acl: parsedConfig[type]?.acl,
        })),
    ).pipe(
      Effect.catchTags({
        /** Shouldn't happen since config is validated above so just dying is fine I think */
        InvalidFileType: (e) => Effect.die(e),
        UnknownFileType: (e) => Effect.die(e),
      }),
    );

    const routeOptions = uploadable.routeOptions;
    const { apiKey, appId } = yield* UTToken;
    const ingestUrl = yield* IngestUrl;
    const isDev = yield* IsDevelopment;

    yield* Effect.logDebug("Generating presigned URLs").pipe(
      Effect.annotateLogs("fileUploadRequests", fileUploadRequests),
      Effect.annotateLogs("ingestUrl", ingestUrl),
    );
    const presignedUrls = yield* Effect.forEach(
      fileUploadRequests,
      (file) =>
        Effect.gen(function* () {
          const key = yield* generateKey(
            file,
            appId,
            routeOptions.getFileHashParts,
          );

          const url = yield* generateSignedURL(`${ingestUrl}/${key}`, apiKey, {
            ttlInSeconds: routeOptions.presignedURLTTL,
            data: {
              "x-ut-identifier": appId,
              "x-ut-file-name": file.name,
              "x-ut-file-size": file.size,
              "x-ut-file-type": file.type,
              "x-ut-slug": slug,
              "x-ut-custom-id": file.customId,
              "x-ut-content-disposition": file.contentDisposition,
              "x-ut-acl": file.acl,
            },
          });
          return { url, key };
        }),
      { concurrency: "unbounded" },
    );

    const serverReq = yield* HttpServerRequest.HttpServerRequest;
    const requestUrl = yield* HttpServerRequest.toURL(serverReq);

    const devHookRequest = yield* Config.string("callbackUrl").pipe(
      Config.withDefault(requestUrl.origin + requestUrl.pathname),
      Effect.map((url) =>
        HttpClientRequest.post(url).pipe(
          HttpClientRequest.appendUrlParam("slug", slug),
        ),
      ),
    );

    const metadataRequest = HttpClientRequest.post("/route-metadata").pipe(
      HttpClientRequest.prependUrl(ingestUrl),
      HttpClientRequest.setHeaders({
        "x-uploadthing-api-key": Redacted.value(apiKey),
        "x-uploadthing-version": pkgJson.version,
        "x-uploadthing-be-adapter": beAdapter,
        "x-uploadthing-fe-package": fePackage,
      }),
      HttpClientRequest.bodyJson({
        fileKeys: presignedUrls.map(({ key }) => key),
        metadata: metadata,
        isDev,
        callbackUrl: devHookRequest.url,
        callbackSlug: slug,
        awaitServerData: routeOptions.awaitServerData ?? true,
      }),
      Effect.flatMap(httpClient.execute),
    );

    const handleDevStreamError = Effect.fn("handleDevStreamError")(function* (
      err: ResponseError,
      chunk: string,
    ) {
      const schema = Schema.parseJson(
        Schema.Struct({ file: UploadedFileData }),
      );
      const parsedChunk = yield* Schema.decodeUnknown(schema)(chunk);
      const key = parsedChunk.file.key;

      yield* Effect.logError(
        "Failed to forward callback request from dev stream",
      ).pipe(Effect.annotateLogs({ fileKey: key, error: err.message }));

      const httpResponse = yield* HttpClientRequest.post(
        "/callback-result",
      ).pipe(
        HttpClientRequest.prependUrl(ingestUrl),
        HttpClientRequest.setHeaders({
          "x-uploadthing-api-key": Redacted.value(apiKey),
          "x-uploadthing-version": pkgJson.version,
          "x-uploadthing-be-adapter": beAdapter,
          "x-uploadthing-fe-package": fePackage,
        }),
        HttpClientRequest.bodyJson({
          fileKey: key,
          error: `Failed to forward callback request from dev stream: ${err.message}`,
        }),
        Effect.flatMap(httpClient.execute),
      );

      yield* logHttpClientResponse("Reported callback error to UploadThing")(
        httpResponse,
      );
    });

    // Send metadata to UT server (non blocking as a daemon)
    // In dev, keep the stream open and simulate the callback requests as
    // files complete uploading
    const fiber = yield* Effect.if(isDev, {
      onTrue: () =>
        metadataRequest.pipe(
          Effect.tapBoth({
            onSuccess: logHttpClientResponse("Registered metadata", {
              mixin: "None", // We're reading the stream so can't call a body mixin
            }),
            onFailure: logHttpClientError("Failed to register metadata"),
          }),
          HttpClientResponse.stream,
          handleJsonLineStream(MetadataFetchStreamPart, (chunk) =>
            devHookRequest.pipe(
              HttpClientRequest.setHeaders({
                "uploadthing-hook": chunk.hook,
                "x-uploadthing-signature": chunk.signature,
              }),
              HttpClientRequest.setBody(
                HttpBody.text(chunk.payload, "application/json"),
              ),
              httpClient.execute,
              Effect.tap(
                logHttpClientResponse(
                  "Successfully forwarded callback request from dev stream",
                ),
              ),
              Effect.catchTag("ResponseError", (err) =>
                handleDevStreamError(err, chunk.payload),
              ),
              Effect.annotateLogs(chunk),
              Effect.asVoid,
              Effect.ignoreLogged,
              Effect.scoped,
            ),
          ),
        ),
      onFalse: () =>
        metadataRequest.pipe(
          Effect.tapBoth({
            onSuccess: logHttpClientResponse("Registered metadata"),
            onFailure: logHttpClientError("Failed to register metadata"),
          }),
          Effect.flatMap(
            HttpClientResponse.schemaBodyJson(MetadataFetchResponse),
          ),
          Effect.scoped,
        ),
    }).pipe(Effect.forkDaemon);

    const presigneds = presignedUrls.map((p, i) => ({
      url: p.url,
      key: p.key,
      name: fileUploadRequests[i]!.name,
      customId: fileUploadRequests[i]!.customId ?? null,
    }));

    yield* Effect.logInfo("Sending presigned URLs to client").pipe(
      Effect.annotateLogs("presignedUrls", presigneds),
    );

    return {
      body: presigneds satisfies UTEvents["upload"]["out"],
      fiber,
    };
  }).pipe(Effect.withLogSpan("handleUploadAction"));
