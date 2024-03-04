import { isDevelopment, process } from "std-env";

import {
  generateUploadThingURL,
  getTypeFromFileName,
  isObject,
  objectKeys,
  fillInputRouteConfig as parseAndExpandInputConfig,
  resolveMaybeUrlArg,
  safeParseJSON,
  UploadThingError,
} from "@uploadthing/shared";
import type {
  ExpandedRouteConfig,
  FetchEsque,
  FileRouterInputKey,
  Json,
} from "@uploadthing/shared";

import type { UploadedFileData } from "../types";
import { UPLOADTHING_VERSION } from "./constants";
import { conditionalDevServer } from "./dev-hook";
import { logger } from "./logger";
import { getParseFn } from "./parser";
import { UTFiles, VALID_ACTION_TYPES } from "./types";
import type {
  ActionType,
  FileRouter,
  MiddlewareFnArgs,
  PresignedURLs,
  RequestHandler,
  RouteHandlerConfig,
  RouteHandlerOptions,
  UTEvents,
  ValidMiddlewareObject,
} from "./types";

/**
 * Creates a wrapped fetch that will always forward a few headers to the server.
 */

const createUTFetch = (
  apiKey: string,
  fetch: FetchEsque,
  fePackage: string,
  beAdapter: string,
) => {
  return async (endpoint: `/${string}`, payload: unknown) => {
    const response = await fetch(generateUploadThingURL(endpoint), {
      method: "POST",
      body: JSON.stringify(payload),
      headers: {
        "Content-Type": "application/json",
        "x-uploadthing-api-key": apiKey,
        "x-uploadthing-version": UPLOADTHING_VERSION,
        "x-uploadthing-fe-package": fePackage,
        "x-uploadthing-be-adapter": beAdapter,
      },
    });

    return response;
  };
};

const fileCountLimitHit = (
  files: { name: string }[],
  routeConfig: ExpandedRouteConfig,
) => {
  const counts: Record<string, number> = {};

  files.forEach((file) => {
    const type = getTypeFromFileName(file.name, objectKeys(routeConfig));

    if (!counts[type]) {
      counts[type] = 1;
    } else {
      counts[type] += 1;
    }
  });

  for (const _key in counts) {
    const key = _key as FileRouterInputKey;
    const count = counts[key];
    const limit = routeConfig[key]?.maxFileCount;

    if (!limit) {
      logger.error(routeConfig, key);
      throw new UploadThingError({
        code: "BAD_REQUEST",
        message: "Invalid config during file count",
        cause: `Expected route config to have a maxFileCount for key ${key} but none was found.`,
      });
    }

    if (count > limit) {
      return { limitHit: true, type: key, limit, count };
    }
  }

  return { limitHit: false };
};

export const buildRequestHandler = <
  TRouter extends FileRouter,
  Args extends MiddlewareFnArgs<any, any, any>,
>(
  opts: RouteHandlerOptions<TRouter>,
  adapter: string,
): RequestHandler<Args> => {
  return async (input) => {
    const isDev = opts.config?.isDev ?? isDevelopment;
    const fetch = opts.config?.fetch ?? globalThis.fetch;

    if (isDev) {
      logger.info("UploadThing dev server is now running!");
    }

    const { router, config } = opts;
    const preferredOrEnvSecret =
      config?.uploadthingSecret ?? process.env.UPLOADTHING_SECRET;

    const req = input.req;
    const url = new URL(req.url);

    // Get inputs from query and params
    const params = url.searchParams;
    const uploadthingHook = req.headers.get("uploadthing-hook") ?? undefined;
    const slug = params.get("slug") ?? undefined;
    const actionType = (params.get("actionType") as ActionType) ?? undefined;
    const utFrontendPackage =
      req.headers.get("x-uploadthing-package") ?? "unknown";

    const clientVersion = req.headers.get("x-uploadthing-version");
    if (clientVersion != null && clientVersion !== UPLOADTHING_VERSION) {
      logger.error("Client version mismatch");
      return new UploadThingError({
        code: "BAD_REQUEST",
        message: "Client version mismatch",
        cause: `Server version: ${UPLOADTHING_VERSION}, Client version: ${clientVersion}`,
      });
    }

    // Validate inputs
    if (!slug) {
      logger.error("No slug provided in params:", params);
      return new UploadThingError({
        code: "BAD_REQUEST",
        message: "No slug provided in params",
      });
    }

    if (slug && typeof slug !== "string") {
      const msg = `Expected slug to be of type 'string', got '${typeof slug}'`;
      logger.error(msg);
      return new UploadThingError({
        code: "BAD_REQUEST",
        message: "`slug` must be a string",
        cause: msg,
      });
    }
    if (actionType && typeof actionType !== "string") {
      const msg = `Expected actionType to be of type 'string', got '${typeof actionType}'`;
      logger.error(msg);
      return new UploadThingError({
        code: "BAD_REQUEST",
        message: "`actionType` must be a string",
        cause: msg,
      });
    }
    if (uploadthingHook && typeof uploadthingHook !== "string") {
      const msg = `Expected uploadthingHook to be of type 'string', got '${typeof uploadthingHook}'`;
      return new UploadThingError({
        code: "BAD_REQUEST",
        message: "`uploadthingHook` must be a string",
        cause: msg,
      });
    }

    if (!preferredOrEnvSecret) {
      const msg = `No secret provided, please set UPLOADTHING_SECRET in your env file or in the config`;
      logger.error(msg);
      return new UploadThingError({
        code: "MISSING_ENV",
        message: `No secret provided`,
        cause: msg,
      });
    }

    if (!preferredOrEnvSecret.startsWith("sk_")) {
      const msg = `Invalid secret provided, UPLOADTHING_SECRET must start with 'sk_'`;
      logger.error(msg);
      return new UploadThingError({
        code: "MISSING_ENV",
        message: "Invalid API key. API keys must start with 'sk_'.",
        cause: msg,
      });
    }

    if (utFrontendPackage && typeof utFrontendPackage !== "string") {
      const msg = `Expected x-uploadthing-package to be of type 'string', got '${typeof utFrontendPackage}'`;
      logger.error(msg);
      return new UploadThingError({
        code: "BAD_REQUEST",
        message:
          "`x-uploadthing-package` must be a string. eg. '@uploadthing/react'",
        cause: msg,
      });
    }

    const uploadable = router[slug];
    if (!uploadable) {
      const msg = `No file route found for slug ${slug}`;
      logger.error(msg);
      return new UploadThingError({
        code: "NOT_FOUND",
        message: msg,
      });
    }

    const utFetch = createUTFetch(
      preferredOrEnvSecret,
      fetch,
      utFrontendPackage,
      adapter,
    );
    logger.debug("All request input is valid", {
      slug,
      actionType,
      uploadthingHook,
    });

    if (uploadthingHook === "callback") {
      // This is when we receive the webhook from uploadthing
      const maybeReqBody = await safeParseJSON<{
        file: UploadedFileData;
        metadata: Record<string, unknown>;
        input?: Json;
      }>(req);

      logger.debug("Handling callback request with input:", maybeReqBody);

      if (maybeReqBody instanceof Error) {
        logger.error("Invalid request body", maybeReqBody);
        return new UploadThingError({
          code: "BAD_REQUEST",
          message: "Invalid request body",
          cause: maybeReqBody,
        });
      }

      const resolverArgs = {
        file: maybeReqBody.file,
        metadata: maybeReqBody.metadata,
      };
      logger.debug(
        "Running 'onUploadComplete' callback with input:",
        resolverArgs,
      );
      const res = (await uploadable.resolver(resolverArgs)) as unknown;
      const payload = {
        fileKey: maybeReqBody.file.key,
        callbackData: res ?? null,
      };
      logger.debug(
        "'onUploadComplete' callback finished. Sending response to UploadThing:",
        payload,
      );
      const callbackResponse = await utFetch("/api/serverCallback", payload);
      logger.debug(
        "UploadThing responded with status:",
        callbackResponse.status,
      );
      return { status: 200, body: null };
    }

    if (!actionType || !VALID_ACTION_TYPES.includes(actionType)) {
      // This would either be someone spamming or the AWS webhook
      const msg = `Expected ${VALID_ACTION_TYPES.map((x) => `"${x}"`)
        .join(", ")
        .replace(/,(?!.*,)/, " or")} but got "${actionType}"`;
      logger.error("Invalid action type.", msg);
      return new UploadThingError({
        code: "BAD_REQUEST",
        cause: `Invalid action type ${actionType}`,
        message: msg,
      });
    }

    switch (actionType) {
      case "upload": {
        const maybeInput = await safeParseJSON<UTEvents["upload"]["in"]>(req);

        if (maybeInput instanceof Error) {
          logger.error("Invalid request body", maybeInput);
          return new UploadThingError({
            code: "BAD_REQUEST",
            message: "Invalid request body",
            cause: maybeInput,
          });
        }

        logger.debug("Handling upload request with input:", maybeInput);
        const { files, input: userInput } = maybeInput;

        // Validate without Zod (for now)
        if (
          !Array.isArray(files) ||
          !files.every(
            (f) =>
              isObject(f) &&
              typeof f.name === "string" &&
              typeof f.size === "number" &&
              typeof f.type === "string",
          )
        ) {
          const msg = `Expected files to be of type '{name:string, size:number, type:string}[]', got '${JSON.stringify(
            files,
          )}'`;
          logger.error(msg);
          return new UploadThingError({
            code: "BAD_REQUEST",
            message: "Files must be an array of objects with name and size",
            cause: msg,
          });
        }

        // validate the input
        let parsedInput: Json = {};
        try {
          logger.debug("Parsing input");
          const inputParser = uploadable._def.inputParser;
          parsedInput = await getParseFn(inputParser)(userInput);
          logger.debug("Input parsed successfully", parsedInput);
        } catch (error) {
          logger.error("An error occured trying to parse input", error);
          return new UploadThingError({
            code: "BAD_REQUEST",
            message: "Invalid input.",
            cause: error,
          });
        }

        let metadata: ValidMiddlewareObject = {};
        try {
          logger.debug("Running middleware");
          metadata = await uploadable._def.middleware({
            ...input.middlewareArgs,
            input: parsedInput,
            files,
          });
          logger.debug("Middleware finished successfully with:", metadata);
        } catch (error) {
          logger.error("An error occured in your middleware function", error);
          if (error instanceof UploadThingError) return error;
          return new UploadThingError({
            code: "INTERNAL_SERVER_ERROR",
            message: "Failed to run middleware.",
            cause: error,
          });
        }

        if (metadata[UTFiles] && metadata[UTFiles].length !== files.length) {
          const msg = `Expected files override to have the same length as original files, got ${metadata[UTFiles].length} but expected ${files.length}`;
          logger.error(msg);
          return new UploadThingError({
            code: "BAD_REQUEST",
            message: "Files override must have the same length as files",
            cause: msg,
          });
        }

        // Attach customIds from middleware to the files
        const filesWithCustomIds = files.map((file, idx) => {
          const theirs = metadata[UTFiles]?.[idx];
          if (theirs && theirs.size !== file.size) {
            logger.warn("File size mismatch. Reverting to original size");
          }
          return {
            name: theirs?.name ?? file.name,
            size: file.size,
            customId: theirs?.customId,
          };
        });

        // FILL THE ROUTE CONFIG so the server only has one happy path
        let parsedConfig: ExpandedRouteConfig;
        try {
          logger.debug("Parsing route config", uploadable._def.routerConfig);
          parsedConfig = parseAndExpandInputConfig(
            uploadable._def.routerConfig,
          );
          logger.debug("Route config parsed successfully", parsedConfig);
        } catch (error) {
          logger.error("Invalid route config", error);
          return new UploadThingError({
            code: "BAD_REQUEST",
            message: "Invalid config.",
            cause: error,
          });
        }

        try {
          logger.debug("Checking file count limit", files);
          const { limitHit, count, limit, type } = fileCountLimitHit(
            files,
            parsedConfig,
          );
          if (limitHit) {
            const msg = `You uploaded ${count} files of type '${type}', but the limit for that type is ${limit}`;
            logger.error(msg);
            return new UploadThingError({
              code: "BAD_REQUEST",
              message: "File limit exceeded",
              cause: msg,
            });
          }
          logger.debug("File count limit check passed");
        } catch (error) {
          logger.error("Invalid route config", error);
          return new UploadThingError({
            code: "BAD_REQUEST",
            message: "Invalid config.",
            cause: error,
          });
        }

        const callbackUrl = resolveCallbackUrl({ config, req, url, isDev });
        logger.debug(
          "Retrieving presigned URLs from UploadThing. Callback URL is:",
          callbackUrl.href,
        );
        const uploadthingApiResponse = await utFetch("/api/prepareUpload", {
          files: filesWithCustomIds,

          routeConfig: parsedConfig,

          metadata,
          callbackUrl: callbackUrl.origin + callbackUrl.pathname,
          callbackSlug: slug,
        });

        // This is when we send the response back to the user's form so they can submit the files
        const parsedResponse = await safeParseJSON<PresignedURLs>(
          uploadthingApiResponse,
        );

        if (!uploadthingApiResponse.ok || parsedResponse instanceof Error) {
          logger.error("Unable to get presigned URLs", parsedResponse);
          return new UploadThingError({
            code: "URL_GENERATION_FAILED",
            message: "Unable to get presigned urls",
            cause: parsedResponse,
          });
        }

        logger.debug("UploadThing responded with:", parsedResponse);
        logger.debug("Sending presigned URLs to client");

        // This is when we send the response back to the user's form so they can submit the files

        let promise: Promise<unknown> | undefined = undefined;
        if (isDev) {
          promise = Promise.all(
            parsedResponse.map((file) =>
              conditionalDevServer({
                fileKey: file.key,
                apiKey: preferredOrEnvSecret,
                fetch,
              }).catch((error) => {
                logger.error("Err", error);
              }),
            ),
          );
        }

        return {
          cleanup: promise,
          body: parsedResponse satisfies UTEvents["upload"]["out"],
          status: 200,
        };
      }
      case "multipart-complete": {
        const maybeReqBody =
          await safeParseJSON<UTEvents["multipart-complete"]["in"]>(req);
        if (maybeReqBody instanceof Error) {
          logger.error("Invalid request body", maybeReqBody);
          return new UploadThingError({
            code: "BAD_REQUEST",
            message: "Invalid request body",
            cause: maybeReqBody,
          });
        }

        logger.debug(
          "Handling multipart-complete request with input:",
          maybeReqBody,
        );
        logger.debug("Notifying UploadThing that multipart upload is complete");

        const completeRes = await utFetch("/api/completeMultipart", {
          fileKey: maybeReqBody.fileKey,
          uploadId: maybeReqBody.uploadId,
          etags: maybeReqBody.etags,
        });
        if (!completeRes.ok) {
          logger.error(
            "Failed to notify UploadThing that multipart upload is complete",
          );
          return new UploadThingError({
            code: "UPLOAD_FAILED",
            message: "Failed to complete multipart upload",
            cause: completeRes,
          });
        }

        logger.debug("UploadThing responded with:", completeRes.status);

        return {
          status: 200,
          body: null satisfies UTEvents["multipart-complete"]["out"],
        };
      }
      case "failure": {
        const maybeReqBody =
          await safeParseJSON<UTEvents["failure"]["in"]>(req);
        if (maybeReqBody instanceof Error) {
          logger.error("Invalid request body", maybeReqBody);
          return new UploadThingError({
            code: "BAD_REQUEST",
            message: "Invalid request body",
            cause: maybeReqBody,
          });
        }
        const { fileKey, uploadId } = maybeReqBody;
        logger.debug("Handling failure request with input:", maybeReqBody);
        logger.debug("Notifying UploadThing that upload failed");

        // Tell uploadthing to mark the upload as failed
        const uploadthingApiResponse = await utFetch("/api/failureCallback", {
          fileKey,
          uploadId,
        });

        if (!uploadthingApiResponse.ok) {
          const parsedResponse = await safeParseJSON(uploadthingApiResponse);
          logger.error("Failed to mark upload as failed", parsedResponse);

          return new UploadThingError({
            code: "INTERNAL_SERVER_ERROR",
            message: "Unable to mark upload as failed",
            cause: parsedResponse,
          });
        }

        logger.debug("UploadThing responded with:", uploadthingApiResponse);
        logger.debug("Running 'onUploadError' callback");

        try {
          // Run the onUploadError callback
          uploadable._def.onUploadError({
            error: new UploadThingError({
              code: "UPLOAD_FAILED",
              message: `Upload failed for ${fileKey}`,
            }),
            fileKey,
          });
        } catch (error) {
          logger.error(
            "Failed to run onUploadError callback. You probably shouldn't be throwing errors in your callback.",
            error,
          );

          return new UploadThingError({
            code: "INTERNAL_SERVER_ERROR",
            message: "Failed to run onUploadError callback",
            cause: error,
          });
        }

        return { status: 200, body: null satisfies UTEvents["failure"]["out"] };
      }
      default: {
        // This should never happen
        return new UploadThingError({
          code: "BAD_REQUEST",
          message: `Invalid action type`,
        });
      }
    }
  };
};

function resolveCallbackUrl(opts: {
  config: RouteHandlerConfig | undefined;
  req: Request;
  url: URL;
  isDev: boolean;
}): URL {
  let callbackUrl = opts.url;
  if (opts.config?.callbackUrl) {
    callbackUrl = resolveMaybeUrlArg(opts.config.callbackUrl);
  } else if (process.env.UPLOADTHING_URL) {
    callbackUrl = resolveMaybeUrlArg(process.env.UPLOADTHING_URL);
  }

  if (opts.isDev || !callbackUrl.host.includes("localhost")) {
    return callbackUrl;
  }

  // Production builds have to have a public URL so UT can send webhook
  // Parse the URL from the headers
  const headers = opts.req.headers;
  let parsedFromHeaders =
    headers.get("origin") ??
    headers.get("referer") ??
    headers.get("host") ??
    headers.get("x-forwarded-host");

  if (parsedFromHeaders && !parsedFromHeaders.includes("http")) {
    parsedFromHeaders =
      (headers.get("x-forwarded-proto") ?? "https") + "://" + parsedFromHeaders;
  }

  if (!parsedFromHeaders || parsedFromHeaders.includes("localhost")) {
    // Didn't find a valid URL in the headers, log a warning and use the original url anyway
    logger.warn(
      "You are using a localhost callback url in production which is not supported.",
      "Read more and learn how to fix it here: https://docs.uploadthing.com/faq#my-callback-runs-in-development-but-not-in-production",
    );
    return callbackUrl;
  }

  return resolveMaybeUrlArg(parsedFromHeaders);
}

export const buildPermissionsInfoHandler = <TRouter extends FileRouter>(
  opts: RouteHandlerOptions<TRouter>,
) => {
  return () => {
    const r = opts.router;

    const permissions = Object.keys(r).map((k) => {
      const route = r[k];
      const config = parseAndExpandInputConfig(route._def.routerConfig);
      return {
        slug: k as keyof TRouter,
        config,
      };
    });

    return permissions;
  };
};
