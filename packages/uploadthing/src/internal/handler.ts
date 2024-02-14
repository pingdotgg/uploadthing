import * as S from "@effect/schema/Schema";
import { Effect, Layer } from "effect";
import type { Tag } from "effect/Context";
import { isDevelopment } from "std-env";

import type { FetchContext } from "@uploadthing/shared";
import {
  fetchContext,
  fetchEffJson,
  generateUploadThingURL,
  objectKeys,
  fillInputRouteConfig as parseAndExpandInputConfig,
  parseRequestJson,
  UploadedFile,
  UploadThingError,
} from "@uploadthing/shared";

import { UPLOADTHING_VERSION } from "./constants";
import { conditionalDevServer } from "./dev-hook";
import { getApiKeyOrThrow } from "./get-api-key";
import { resolveCallbackUrl } from "./get-full-api-url";
import { logger } from "./logger";
import {
  abortMultipartUpload,
  completeMultipartUpload,
} from "./multi-part.server";
import { getParseFn } from "./parser";
import type { PresignedURLResponse } from "./shared-schemas";
import {
  MultipartCompleteActionPayload,
  MultipartFailureActionPayload,
  PresignedURLResponseSchema,
  UploadActionPayload,
} from "./shared-schemas";
import { UTFiles } from "./types";
import type {
  AnyMiddlewareFnArgs,
  AnyParams,
  FileRouter,
  RouteHandlerConfig,
  RouterWithConfig,
  Uploader,
  ValidMiddlewareObject,
} from "./types";
import {
  fileCountLimitHit,
  parseAndValidateRequest,
} from "./validate-request-input";

type RequestHandlerInput<TArgs extends AnyMiddlewareFnArgs> = {
  req: Request;
  middlewareArgs: TArgs;
};
type RequestHandlerOutput = Effect.Effect<
  | {
      status: number;
      body?: PresignedURLResponse;
      cleanup?: Promise<unknown>;
    }
  | UploadThingError,
  never,
  Tag.Identifier<FetchContext>
>;
type RequestHandler<TArgs extends AnyMiddlewareFnArgs> = (
  input: RequestHandlerInput<TArgs>,
) => RequestHandlerOutput;

export const runRequestHandlerAsync = <TArgs extends AnyMiddlewareFnArgs>(
  handler: RequestHandler<TArgs>,
  args: RequestHandlerInput<TArgs>,
  config?: RouteHandlerConfig | undefined,
) => {
  const layer = Layer.succeed(fetchContext, {
    fetch: config?.fetch ?? globalThis.fetch,
    baseHeaders: {
      "Content-Type": "application/json",
      "x-uploadthing-version": UPLOADTHING_VERSION,
      "x-uploadthing-api-key": getApiKeyOrThrow(config?.uploadthingSecret),
    },
  });

  return handler(args).pipe(
    Effect.provide(layer),
    Effect.andThen((data) => {
      if ("status" in data && data.status !== 200) {
        return Effect.fail(new UploadThingError("An unknown error occured"));
      }
      return Effect.succeed(data);
    }),
    Effect.runPromise,
  );
};

export const buildRequestHandler =
  <TRouter extends FileRouter, Args extends AnyMiddlewareFnArgs>(
    opts: RouterWithConfig<TRouter>,
    adapter: string,
  ): RequestHandler<Args> =>
  (input) =>
    Effect.gen(function* ($) {
      const { slug, uploadable, hook, action } = yield* $(
        parseAndValidateRequest({ req: input.req, opts, adapter }),
      );

      const { isDev = isDevelopment } = opts.config ?? {};
      if (isDev) {
        logger.info("UploadThing dev server is now running!");
      }

      if (hook === "callback") {
        // This is when we receive the webhook from uploadthing
        return yield* $(
          handleCallbackRequest({
            req: input.req,
            uploadable,
          }),
        );
      }

      switch (action) {
        case "upload": {
          return yield* $(
            handleUploadAction({
              req: input.req,
              middlewareArgs: input.middlewareArgs,
              uploadable,
              config: opts.config,
              isDev,
              slug,
            }),
          );
        }
        case "multipart-complete": {
          return yield* $(
            handleMultipartCompleteAction({
              req: input.req,
            }),
          );
        }
        case "failure": {
          return yield* $(
            handleMultipartFailureAction({
              req: input.req,
              uploadable,
            }),
          );
        }
        default: {
          action satisfies never;
          return yield* $(
            Effect.fail(
              new UploadThingError({
                code: "BAD_REQUEST",
                message: `Invalid action type ${action as string}`,
              }),
            ),
          );
        }
      }
    }).pipe(
      // TODO: Maybe look over this error handling
      // Now we return UploadThingError and die on everything else
      Effect.catchTag("FetchError", (err) => {
        logger.error("An error occurred while fetching", err);
        return Effect.die(err);
      }),
      Effect.catchTag("ParseError", (err) => {
        logger.error("An error occurred while parsing input/output", err);
        return Effect.die(err);
      }),
      Effect.match({
        onSuccess: (x) => x,
        onFailure: (e) => e,
      }),
    );

const handleCallbackRequest = (opts: {
  req: Request;
  uploadable: Uploader<AnyParams>;
}) =>
  Effect.gen(function* ($) {
    const requestInput = yield* $(
      parseRequestJson(
        opts.req,
        S.struct({
          file: UploadedFile,
          metadata: S.record(S.string, S.unknown),
        }),
      ),
    );
    logger.debug("Handling callback request with input:", requestInput);

    const serverData = yield* $(
      Effect.tryPromise({
        try: async () =>
          opts.uploadable.resolver(requestInput) as Promise<unknown>,
        catch: (error) => {
          logger.error(
            "Failed to run onUploadComplete. You probably shouldn't be throwing errors here.",
            error,
          );
          return new UploadThingError({
            code: "INTERNAL_SERVER_ERROR",
            message: "Failed to run onUploadComplete",
            cause: error,
          });
        },
      }),
    );
    const payload = {
      fileKey: requestInput.file.key,
      callbackData: serverData ?? null,
    };
    logger.debug(
      "'onUploadComplete' callback finished. Sending response to UploadThing:",
      payload,
    );

    yield* $(
      fetchEffJson(generateUploadThingURL("/api/serverCallback"), S.any, {
        method: "POST",
        body: JSON.stringify(payload),
      }),
    );
    return { status: 200 };
  });

const runRouteMiddleware = (opts: {
  uploadable: Uploader<AnyParams>;
  middlewareArgs: AnyMiddlewareFnArgs;
  routeInput: S.Schema.To<typeof UploadActionPayload>["input"];
  files: S.Schema.To<typeof UploadActionPayload>["files"];
}) =>
  Effect.gen(function* ($) {
    const { files } = opts;

    logger.debug("Running middleware");
    const metadata: ValidMiddlewareObject = yield* $(
      Effect.tryPromise({
        try: async () =>
          opts.uploadable._def.middleware({
            ...opts.middlewareArgs,
            input: opts.routeInput,
            files: files,
          }),
        catch: (error) => {
          logger.error("An error occured in your middleware function", error);
          if (error instanceof UploadThingError) return error;
          return new UploadThingError({
            code: "INTERNAL_SERVER_ERROR",
            message: "Failed to run middleware.",
            cause: error,
          });
        },
      }),
    );

    if (metadata[UTFiles] && metadata[UTFiles].length !== files.length) {
      const msg = `Expected files override to have the same length as original files, got ${metadata[UTFiles].length} but expected ${files.length}`;
      logger.error(msg);
      return yield* $(
        Effect.fail(
          new UploadThingError({
            code: "BAD_REQUEST",
            message: "Files override must have the same length as files",
            cause: msg,
          }),
        ),
      );
    }

    // Attach customIds from middleware to the files
    const filesWithCustomIds = files.map((file, idx) => {
      const theirs = metadata[UTFiles]?.[idx];
      if (theirs && theirs.size !== file.size) {
        logger.warn("File size mismatch. Reverting to original size");
      }
      return {
        ...file,
        ...theirs,
        size: file.size,
      };
    });

    return { metadata, filesWithCustomIds };
  });

const handleUploadAction = (opts: {
  req: Request;
  uploadable: Uploader<AnyParams>;
  middlewareArgs: AnyMiddlewareFnArgs;
  config: RouterWithConfig<FileRouter>["config"];

  isDev: boolean;
  slug: string;
}) =>
  Effect.gen(function* ($) {
    const { files, input } = yield* $(
      parseRequestJson(opts.req, UploadActionPayload),
    );
    logger.debug("Handling upload request with input:", { files, input });

    // validate the input
    logger.debug("Parsing user input");
    const inputParser = opts.uploadable._def.inputParser;
    const parsedInput = yield* $(
      Effect.tryPromise({
        try: async () => getParseFn(inputParser)(input),
        catch: (error) => {
          logger.error("An error occured trying to parse input", error);
          return new UploadThingError({
            code: "BAD_REQUEST",
            message: "Invalid input.",
            cause: error,
          });
        },
      }),
    );
    logger.debug("Input parsed successfully", parsedInput);

    const { metadata, filesWithCustomIds } = yield* $(
      runRouteMiddleware({
        uploadable: opts.uploadable,
        middlewareArgs: opts.middlewareArgs,
        routeInput: parsedInput,
        files,
      }),
    );

    logger.debug("Parsing route config", opts.uploadable._def.routerConfig);
    const parsedConfig = yield* $(
      Effect.try({
        try: () => parseAndExpandInputConfig(opts.uploadable._def.routerConfig),
        catch: (error) => {
          logger.error("Invalid route config", error);
          return new UploadThingError({
            code: "BAD_REQUEST",
            message: "Invalid config.",
            cause: error,
          });
        },
      }),
    );

    logger.debug("Checking file count limit", files);
    yield* $(
      Effect.try({
        try: () => fileCountLimitHit(files, parsedConfig),
        catch: (error) => {
          if (error instanceof UploadThingError) return error;
          return new UploadThingError({
            code: "INTERNAL_SERVER_ERROR",
            message: "Failed to run file count limit check.",
            cause: error,
          });
        },
      }),
      Effect.andThen(({ limitHit, count, type, limit }) => {
        if (!limitHit) return;

        const msg = `You uploaded ${count} files of type '${type}', but the limit for that type is ${limit}`;
        logger.error(msg);
        return new UploadThingError({
          code: "BAD_REQUEST",
          message: "File limit exceeded",
          cause: msg,
        });
      }),
    );

    const callbackUrl = resolveCallbackUrl({
      config: opts.config,
      req: opts.req,
      isDev: opts.isDev,
      logWarning: logger.warn,
    });
    logger.debug(
      "Retrieving presigned URLs from UploadThing. Callback URL is:",
      callbackUrl.href,
    );

    const presignedUrls = yield* $(
      fetchEffJson(
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
        },
      ),
    );

    logger.debug("UploadThing responded with:", presignedUrls);
    logger.debug("Sending presigned URLs to client");

    let promise: Promise<unknown> | undefined = undefined;
    if (opts.isDev) {
      promise = Effect.forEach(presignedUrls, (file) =>
        conditionalDevServer(file.key),
      ).pipe(
        Effect.provide(Layer.succeed(fetchContext, yield* $(fetchContext))),
        Effect.runPromise,
      );
    }

    return { status: 200, body: presignedUrls, cleanup: promise };
  });

const handleMultipartCompleteAction = (opts: { req: Request }) =>
  Effect.gen(function* ($) {
    const requestInput = yield* $(
      parseRequestJson(opts.req, MultipartCompleteActionPayload),
    );

    logger.debug(
      "Handling multipart-complete request with input:",
      requestInput,
    );
    logger.debug("Notifying UploadThing that multipart upload is complete");

    const completionResponse = yield* $(
      completeMultipartUpload(
        {
          key: requestInput.fileKey,
          uploadId: requestInput.uploadId,
        },
        requestInput.etags,
      ),
    );
    logger.debug("UploadThing responded with:", completionResponse);

    return { status: 200 };
  });

const handleMultipartFailureAction = (opts: {
  req: Request;
  uploadable: Uploader<AnyParams>;
}) =>
  Effect.gen(function* ($) {
    const { fileKey, uploadId } = yield* $(
      parseRequestJson(opts.req, MultipartFailureActionPayload),
    );
    logger.debug("Handling failure request with input:", { fileKey, uploadId });
    logger.debug("Notifying UploadThing that upload failed");

    const failureResponse = yield* $(
      abortMultipartUpload({ key: fileKey, uploadId }),
    );
    logger.debug("UploadThing responded with:", failureResponse);
    logger.debug("Running 'onUploadError' callback");

    yield* $(
      Effect.try({
        try: () => {
          opts.uploadable._def.onUploadError({
            error: new UploadThingError({
              code: "UPLOAD_FAILED",
              message: `Upload failed for ${fileKey}`,
            }),
            fileKey,
          });
        },
        catch: (error) => {
          logger.error(
            "Failed to run onUploadError. You probably shouldn't be throwing errors here.",
            error,
          );
          return new UploadThingError({
            code: "INTERNAL_SERVER_ERROR",
            message: "Failed to run onUploadError",
            cause: error,
          });
        },
      }),
    );

    return { status: 200 };
  });

export const buildPermissionsInfoHandler = <TRouter extends FileRouter>(
  opts: RouterWithConfig<TRouter>,
) => {
  return () => {
    const permissions = objectKeys(opts.router).map((slug) => {
      const route = opts.router[slug];
      const config = parseAndExpandInputConfig(route._def.routerConfig);
      return {
        slug,
        config,
      };
    });

    return permissions;
  };
};
