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
import * as S from "@effect/schema/Schema";
import * as Config from "effect/Config";
import * as Context from "effect/Context";
import * as Effect from "effect/Effect";
import * as Layer from "effect/Layer";
import * as Logger from "effect/Logger";
import * as ManagedRuntime from "effect/ManagedRuntime";
import * as Match from "effect/Match";
import * as Redacted from "effect/Redacted";

import {
  fillInputRouteConfig,
  generateKey,
  generateSignedURL,
  getStatusCodeFromError,
  getTypeFromFileName,
  objectKeys,
  UploadThingError,
  verifySignature,
} from "@uploadthing/shared";

import * as pkgJson from "../../package.json";
import { configProvider, IngestUrl, IsDevelopment, UTToken } from "./config";
import { formatError } from "./error-formatter";
import { handleJsonLineStream } from "./jsonl";
import { withMinimalLogLevel } from "./logger";
import { getParseFn } from "./parser";
import { assertFilesMeetConfig, extractRouterConfig } from "./route-config";
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
import type {
  AnyParams,
  FileRouter,
  MiddlewareFnArgs,
  RouteHandlerOptions,
  Uploader,
  UTEvents,
  ValidMiddlewareObject,
} from "./types";

export class MiddlewareArguments extends Context.Tag(
  "uploadthing/MiddlewareArguments",
)<MiddlewareArguments, MiddlewareFnArgs<any, any, any>>() {}

export const makeAdapterHandler = <Args extends any[]>(
  makeMiddlewareArgs: (
    ...args: Args
  ) => Effect.Effect<MiddlewareFnArgs<any, any, any>>,
  toRequest: (...args: Args) => Effect.Effect<Request>,
  opts: RouteHandlerOptions<FileRouter>,
  beAdapter: string,
): ((...args: Args) => Promise<Response>) => {
  const layer = Layer.mergeAll(
    Logger.pretty,
    withMinimalLogLevel,
    HttpClient.layer,
    Layer.succeed(
      HttpClient.Fetch,
      opts.config?.fetch as typeof globalThis.fetch,
    ),
    Layer.setConfigProvider(configProvider(opts.config)),
  );

  const managed = ManagedRuntime.make(layer);

  const handle = Effect.promise(() =>
    managed.runtime().then(HttpApp.toWebHandlerRuntime),
  );

  const app = (...args: Args) =>
    Effect.map(
      Effect.promise(() =>
        managed.runPromise(createRequestHandler(opts, beAdapter)),
      ),
      Effect.provideServiceEffect(
        MiddlewareArguments,
        makeMiddlewareArgs(...args),
      ),
    );

  return async (...args: Args) =>
    await handle.pipe(
      Effect.ap(app(...args)),
      Effect.ap(toRequest(...args)),
      Effect.withLogSpan("requestHandler"),
      managed.runPromise,
    );
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
        S.Struct({
          "uploadthing-hook": UploadThingHook.pipe(S.optional),
          "x-uploadthing-package": S.String.pipe(
            S.optionalWith({ default: () => "unknown" }),
          ),
          "x-uploadthing-version": S.String.pipe(
            S.optionalWith({ default: () => pkgJson.version }),
          ),
        }),
      );

      if (clientVersion !== pkgJson.version) {
        const msg = `Server version: ${pkgJson.version}, Client version: ${clientVersion}`;
        yield* Effect.logError(msg);
        return yield* new UploadThingError({
          code: "BAD_REQUEST",
          message: "Client version mismatch",
          cause: msg,
        });
      }

      const { slug, actionType } = yield* HttpRouter.schemaParams(
        S.Struct({
          actionType: ActionType.pipe(S.optional),
          slug: S.String,
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

const handleErrorRequest = (opts: { uploadable: Uploader<AnyParams> }) =>
  Effect.gen(function* () {
    const { uploadable } = opts;
    const request = yield* HttpServerRequest.HttpServerRequest;
    const { apiKey } = yield* UTToken;
    const verified = yield* verifySignature(
      yield* request.text,
      request.headers["x-uploadthing-signature"],
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
      S.Struct({
        fileKey: S.String,
        error: S.String,
      }),
    );
    yield* Effect.logDebug("Handling error callback request with input:").pipe(
      Effect.annotateLogs("json", requestInput),
    );

    const fiber = yield* Effect.tryPromise({
      try: async () =>
        uploadable._def.onUploadError({
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
  uploadable: Uploader<AnyParams>;
  fePackage: string;
  beAdapter: string;
}) =>
  Effect.gen(function* () {
    const { uploadable, fePackage, beAdapter } = opts;
    const request = yield* HttpServerRequest.HttpServerRequest;
    const { apiKey } = yield* UTToken;
    const verified = yield* verifySignature(
      yield* request.text,
      request.headers["x-uploadthing-signature"],
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
      S.Struct({
        status: S.String,
        file: UploadedFileData,
        metadata: S.Record({ key: S.String, value: S.Unknown }),
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
      ).pipe(Effect.annotateLogs("callbackData", payload));

      const baseUrl = yield* IngestUrl;
      const httpClient = yield* HttpClient.HttpClient;
      yield* HttpClientRequest.post(`/callback-result`).pipe(
        HttpClientRequest.prependUrl(baseUrl),
        HttpClientRequest.setHeaders({
          "x-uploadthing-api-key": Redacted.value(apiKey),
          "x-uploadthing-version": pkgJson.version,
          "x-uploadthing-be-adapter": beAdapter,
          "x-uploadthing-fe-package": fePackage,
        }),
        HttpClientRequest.jsonBody(payload),
        Effect.flatMap(HttpClient.filterStatusOk(httpClient)),
        Effect.tapErrorTag("ResponseError", ({ response: res }) =>
          Effect.flatMap(res.json, (json) =>
            Effect.logError(
              `Failed to register callback result (${res.status})`,
            ).pipe(Effect.annotateLogs("error", json)),
          ),
        ),
        HttpClientResponse.schemaBodyJsonScoped(CallbackResultResponse),
        Effect.tap(Effect.log("Sent callback result to UploadThing")),
      );
    }).pipe(Effect.ignoreLogged, Effect.forkDaemon);

    return { body: null, fiber };
  }).pipe(Effect.withLogSpan("handleCallbackRequest"));

const runRouteMiddleware = (opts: {
  json: typeof UploadActionPayload.Type;
  uploadable: Uploader<AnyParams>;
}) =>
  Effect.gen(function* () {
    const middlewareArgs = yield* MiddlewareArguments;
    const {
      json: { files, input },
      uploadable,
    } = opts;

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
  }).pipe(Effect.withLogSpan("runRouteMiddleware"));

const handleUploadAction = (opts: {
  uploadable: Uploader<AnyParams>;
  fePackage: string;
  beAdapter: string;
  slug: string;
}) =>
  Effect.gen(function* () {
    const httpClient = yield* HttpClient.HttpClient;
    const { uploadable, fePackage, beAdapter, slug } = opts;
    const json = yield* HttpServerRequest.schemaBodyJson(UploadActionPayload);
    yield* Effect.logDebug("Handling upload request").pipe(
      Effect.annotateLogs("json", json),
    );

    // validate the input
    yield* Effect.logDebug("Parsing user input");
    const inputParser = uploadable._def.inputParser;
    const parsedInput = yield* Effect.tryPromise({
      try: async () => getParseFn(inputParser)(json.input),
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
      Effect.annotateLogs("routerConfig", uploadable._def.routerConfig),
    );
    const parsedConfig = yield* fillInputRouteConfig(
      uploadable._def.routerConfig,
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
        Effect.map(
          getTypeFromFileName(file.name, objectKeys(parsedConfig)),
          (type) => ({
            name: file.name,
            size: file.size,
            type: file.type,
            lastModified: file.lastModified,
            customId: file.customId,
            contentDisposition:
              parsedConfig[type]?.contentDisposition ?? "inline",
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

    const routeOptions = uploadable._def.routeOptions;
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
      HttpClientRequest.jsonBody({
        fileKeys: presignedUrls.map(({ key }) => key),
        metadata: metadata,
        isDev,
        callbackUrl: devHookRequest.url,
        callbackSlug: slug,
        awaitServerData: routeOptions.awaitServerData ?? true,
      }),
      Effect.flatMap(HttpClient.filterStatusOk(httpClient)),
      Effect.tapBoth({
        onSuccess: (res) =>
          Effect.logDebug("Registerred metadata").pipe(
            Effect.annotateLogs("response", res),
          ),
        onFailure: (err) =>
          err._tag === "ResponseError"
            ? Effect.flatMap(err.response.json, (json) =>
                Effect.logError(
                  `Failed to register metadata (${err.response.status})`,
                ).pipe(
                  Effect.annotateLogs("response", err.response),
                  Effect.annotateLogs("json", json),
                ),
              )
            : Effect.logError("Failed to register metadata").pipe(
                Effect.annotateLogs("error", err),
              ),
      }),
    );

    // Send metadata to UT server (non blocking as a daemon)
    // In dev, keep the stream open and simulate the callback requests as
    // files complete uploading
    const fiber = yield* Effect.if(isDev, {
      onTrue: () =>
        metadataRequest.pipe(
          HttpClientResponse.stream,
          handleJsonLineStream(
            MetadataFetchStreamPart,
            ({ payload, signature, hook }) =>
              devHookRequest.pipe(
                HttpClientRequest.setHeaders({
                  "uploadthing-hook": hook,
                  "x-uploadthing-signature": signature,
                }),
                HttpClientRequest.setBody(
                  HttpBody.text(payload, "application/json"),
                ),
                httpClient,
                HttpClientResponse.arrayBuffer,
                Effect.asVoid,
                Effect.tapBoth({
                  onSuccess: (res) =>
                    Effect.logDebug(
                      "Successfully forwarded callback request from dev stream",
                    ).pipe(
                      Effect.annotateLogs("response", res),
                      Effect.annotateLogs("hook", hook),
                      Effect.annotateLogs("signature", signature),
                      Effect.annotateLogs("payload", payload),
                    ),
                  onFailure: (err) =>
                    err._tag === "ResponseError"
                      ? Effect.flatMap(err.response.json, (json) =>
                          Effect.logError(
                            `Failed to forward callback request from dev stream (${err.response.status})`,
                          ).pipe(
                            Effect.annotateLogs("response", err.response),
                            Effect.annotateLogs("json", json),
                            Effect.annotateLogs("hook", hook),
                            Effect.annotateLogs("signature", signature),
                            Effect.annotateLogs("payload", payload),
                          ),
                        )
                      : Effect.logError(
                          "Failed to forward callback request from dev stream",
                        ).pipe(Effect.annotateLogs("error", err)),
                }),
                Effect.ignoreLogged,
              ),
          ),
        ),
      onFalse: () =>
        metadataRequest.pipe(
          HttpClientResponse.schemaBodyJsonScoped(MetadataFetchResponse),
        ),
    }).pipe(Effect.forkDaemon);

    const presigneds = presignedUrls.map((p, i) => ({
      url: p.url,
      key: p.key,
      name: fileUploadRequests[i].name,
      customId: fileUploadRequests[i].customId ?? null,
    }));

    yield* Effect.logInfo("Sending presigned URLs to client").pipe(
      Effect.annotateLogs("presignedUrls", presigneds),
    );

    return {
      body: presigneds satisfies UTEvents["upload"]["out"],
      fiber,
    };
  }).pipe(Effect.withLogSpan("handleUploadAction"));
