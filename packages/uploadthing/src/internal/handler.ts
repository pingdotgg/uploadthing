import type { MimeType } from "@uploadthing/mime-types/db";
import {
  generateUploadThingURL,
  getTypeFromFileName,
  getUploadthingUrl,
  isObject,
  objectKeys,
  fillInputRouteConfig as parseAndExpandInputConfig,
  safeParseJSON,
  UploadThingError,
} from "@uploadthing/shared";
import type {
  ContentDisposition,
  ExpandedRouteConfig,
  FileRouterInputKey,
  Json,
  RequestLike,
  UploadedFile,
} from "@uploadthing/shared";

import { UPLOADTHING_VERSION } from "../constants";
import { conditionalDevServer } from "./dev-hook";
import { getParseFn } from "./parser";
import { VALID_ACTION_TYPES } from "./types";
import type { ActionType, FileRouter, UTEvents } from "./types";

/**
 * Creates a wrapped fetch that will always forward a few headers to the server.
 */
const createUTFetch = (apiKey: string) => {
  return async (endpoint: `/${string}`, payload: unknown) => {
    const response = await fetch(generateUploadThingURL(endpoint), {
      method: "POST",
      body: JSON.stringify(payload),
      headers: {
        "Content-Type": "application/json",
        "x-uploadthing-api-key": apiKey,
        "x-uploadthing-version": UPLOADTHING_VERSION,
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
      console.error(routeConfig, key);
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

export type RouterWithConfig<TRouter extends FileRouter> = {
  router: TRouter;
  config?: {
    callbackUrl?: string;
    uploadthingId?: string;
    uploadthingSecret?: string;
  };
};

const getHeader = (req: RequestLike, key: string) => {
  if (req.headers instanceof Headers) {
    return req.headers.get(key);
  }
  return req.headers[key];
};

export type UploadThingResponse = {
  presignedUrls: string[];
  key: string;
  pollingUrl: string;
  uploadId: string;
  fileName: string;
  fileType: MimeType;
  contentDisposition: ContentDisposition;
  chunkCount: number;
  chunkSize: number;
}[];

export const buildRequestHandler = <TRouter extends FileRouter>(
  opts: RouterWithConfig<TRouter>,
) => {
  return async (input: {
    req: RequestLike;
    res?: unknown;
    event?: unknown;
  }): Promise<
    UploadThingError | { status: 200; body?: UploadThingResponse }
  > => {
    if (process.env.NODE_ENV === "development") {
      console.log("[UT] UploadThing dev server is now running!");
    }

    const { req, res, event } = input;
    const { router, config } = opts;
    const preferredOrEnvSecret =
      config?.uploadthingSecret ?? process.env.UPLOADTHING_SECRET;

    // Get inputs from query and params
    const params = new URL(req.url ?? "", getUploadthingUrl()).searchParams;
    const uploadthingHook = getHeader(req, "uploadthing-hook") ?? undefined;
    const slug = params.get("slug") ?? undefined;
    const actionType = (params.get("actionType") as ActionType) ?? undefined;

    // Validate inputs
    if (!slug)
      return new UploadThingError({
        code: "BAD_REQUEST",
        message: "No slug provided",
      });

    if (slug && typeof slug !== "string") {
      return new UploadThingError({
        code: "BAD_REQUEST",
        message: "`slug` must be a string",
        cause: `Expected slug to be of type 'string', got '${typeof slug}'`,
      });
    }
    if (actionType && typeof actionType !== "string") {
      return new UploadThingError({
        code: "BAD_REQUEST",
        message: "`actionType` must be a string",
        cause: `Expected actionType to be of type 'string', got '${typeof actionType}'`,
      });
    }
    if (uploadthingHook && typeof uploadthingHook !== "string") {
      return new UploadThingError({
        code: "BAD_REQUEST",
        message: "`uploadthingHook` must be a string",
        cause: `Expected uploadthingHook to be of type 'string', got '${typeof uploadthingHook}'`,
      });
    }

    if (!preferredOrEnvSecret) {
      return new UploadThingError({
        code: "BAD_REQUEST",
        message: `Please set your preferred secret in ${slug} router's config or set UPLOADTHING_SECRET in your env file`,
        cause: "No secret provided",
      });
    }

    const uploadable = router[slug];
    if (!uploadable) {
      return new UploadThingError({
        code: "NOT_FOUND",
        message: `No file route found for slug ${slug}`,
      });
    }

    if (uploadthingHook === "callback") {
      // This is when we receive the webhook from uploadthing
      const maybeReqBody = await safeParseJSON<{
        file: UploadedFile;
        files: unknown;
        metadata: Record<string, unknown>;
        input?: Json;
      }>(req);

      if (maybeReqBody instanceof Error) {
        return new UploadThingError({
          code: "BAD_REQUEST",
          message: "Invalid request body",
          cause: maybeReqBody,
        });
      }

      await uploadable.resolver({
        file: maybeReqBody.file,
        metadata: maybeReqBody.metadata,
      });

      return { status: 200 };
    }

    if (!actionType || !VALID_ACTION_TYPES.includes(actionType)) {
      // This would either be someone spamming or the AWS webhook
      return new UploadThingError({
        code: "BAD_REQUEST",
        cause: `Invalid action type ${actionType}`,
        message: `Expected ${VALID_ACTION_TYPES.map((x) => `"${x}"`)
          .join(", ")
          .replace(/,(?!.*,)/, " or")} but got "${"a"}"`,
      });
    }

    const utFetch = createUTFetch(preferredOrEnvSecret);

    switch (actionType) {
      case "upload": {
        const maybeInput = await safeParseJSON<UTEvents["upload"]>(req);

        if (maybeInput instanceof Error) {
          return new UploadThingError({
            code: "BAD_REQUEST",
            message: "Invalid request body",
            cause: maybeInput,
          });
        }
        const { files, input: userInput } = maybeInput;

        // validate the input
        let parsedInput: Json = {};
        try {
          const inputParser = uploadable._def.inputParser;
          parsedInput = await getParseFn(inputParser)(userInput);
        } catch (error) {
          console.error(error);
          return new UploadThingError({
            code: "BAD_REQUEST",
            message: "Invalid input.",
            cause: error,
          });
        }

        let metadata: Json = {};
        try {
          metadata = await uploadable._def.middleware({
            // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment
            req: req as any,
            // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment
            res: res as any,
            event,
            input: parsedInput,
          });
        } catch (error) {
          console.error(error);
          return new UploadThingError({
            code: "INTERNAL_SERVER_ERROR",
            message: "Failed to run middleware.",
            cause: error,
          });
        }

        // Validate without Zod (for now)
        if (
          !Array.isArray(files) ||
          !files.every(
            (f) =>
              isObject(f) &&
              typeof f.name === "string" &&
              typeof f.size === "number",
          )
        )
          return new UploadThingError({
            code: "BAD_REQUEST",
            message: "Files must be an array of objects with name and size",
            cause: `Expected files to be of type '{name:string, size:number}[]', got '${JSON.stringify(
              files,
            )}'`,
          });

        // FILL THE ROUTE CONFIG so the server only has one happy path
        let parsedConfig: ReturnType<typeof parseAndExpandInputConfig>;
        try {
          parsedConfig = parseAndExpandInputConfig(
            uploadable._def.routerConfig,
          );
        } catch (error) {
          console.error(error);
          return new UploadThingError({
            code: "BAD_REQUEST",
            message: "Invalid config.",
            cause: error,
          });
        }

        try {
          const { limitHit, count, limit, type } = fileCountLimitHit(
            files,
            parsedConfig,
          );
          if (limitHit) {
            return new UploadThingError({
              code: "BAD_REQUEST",
              message: "File limit exceeded",
              cause: `You uploaded ${count} files of type '${type}', but the limit for that type is ${limit}`,
            });
          }
        } catch (error) {
          console.error(error);
          return new UploadThingError({
            code: "BAD_REQUEST",
            message: "Invalid config.",
            cause: error,
          });
        }

        const uploadthingApiResponse = await utFetch("/api/prepareUpload", {
          files: files,

          routeConfig: parsedConfig,

          metadata,
          callbackUrl: config?.callbackUrl ?? getUploadthingUrl(),
          callbackSlug: slug,
        });

        // This is when we send the response back to the user's form so they can submit the files
        const parsedResponse = await safeParseJSON<UploadThingResponse>(
          uploadthingApiResponse,
        );

        if (!uploadthingApiResponse.ok || parsedResponse instanceof Error) {
          console.error("[UT] unable to get presigned urls");
          return new UploadThingError({
            code: "URL_GENERATION_FAILED",
            message: "Unable to get presigned urls",
            cause: parsedResponse,
          });
        }

        // This is when we send the response back to the user's form so they can submit the files

        if (process.env.NODE_ENV === "development") {
          for (const file of parsedResponse) {
            void conditionalDevServer({
              fileKey: file.key,
              apiKey: preferredOrEnvSecret,
            });
          }
        }

        return {
          body: parsedResponse.map((x) => ({
            ...x,
            pollingUrl: generateUploadThingURL(`/api/pollUpload/${x.key}`),
          })),
          status: 200,
        };
      }
      case "multipart-complete": {
        const maybeReqBody = await safeParseJSON<
          UTEvents["multipart-complete"]
        >(req);
        if (maybeReqBody instanceof Error) {
          return new UploadThingError({
            code: "BAD_REQUEST",
            message: "Invalid request body",
            cause: maybeReqBody,
          });
        }

        const completeRes = await utFetch("/api/completeMultipart", {
          fileKey: maybeReqBody.fileKey,
          uploadId: maybeReqBody.uploadId,
          etags: maybeReqBody.etags,
        });
        if (!completeRes.ok) {
          return new UploadThingError({
            code: "UPLOAD_FAILED",
            message: "Failed to complete multipart upload",
          });
        }

        return { status: 200 };
      }
      case "failure": {
        const maybeReqBody = await safeParseJSON<UTEvents["failure"]>(req);
        if (maybeReqBody instanceof Error) {
          return new UploadThingError({
            code: "BAD_REQUEST",
            message: "Invalid request body",
            cause: maybeReqBody,
          });
        }
        const { fileKey, uploadId } = maybeReqBody;

        // Tell uploadthing to mark the upload as failed
        const uploadthingApiResponse = await utFetch("/api/failureCallback", {
          fileKey,
          uploadId,
        });

        if (!uploadthingApiResponse.ok) {
          console.error("[UT] failed to mark upload as failed");
          const parsedResponse = await safeParseJSON<UploadThingResponse>(
            uploadthingApiResponse,
          );
          return new UploadThingError({
            code: "URL_GENERATION_FAILED",
            message: "Unable to get presigned urls",
            cause: parsedResponse,
          });
        }

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
          console.error(
            "[UT] Failed to run onUploadError callback. You probably shouldn't be throwing errors in your callback.",
          );
          console.error(error);

          return new UploadThingError({
            code: "INTERNAL_SERVER_ERROR",
            message: "Failed to run onUploadError callback",
            cause: error,
          });
        }

        return { status: 200 };
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

export const buildPermissionsInfoHandler = <TRouter extends FileRouter>(
  opts: RouterWithConfig<TRouter>,
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
