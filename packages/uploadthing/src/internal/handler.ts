import {
  generateUploadThingURL,
  getTypeFromFileName,
  getUploadthingUrl,
  fillInputRouteConfig as parseAndExpandInputConfig,
  UploadThingError,
} from "@uploadthing/shared";
import type {
  ExpandedRouteConfig,
  FileRouterInputKey,
  Json,
  UploadedFile,
} from "@uploadthing/shared";

import { UPLOADTHING_VERSION } from "../constants";
import { conditionalDevServer } from "./dev-hook";
import { getParseFn } from "./parser";
import { VALID_ACTION_TYPES } from "./types";
import type { ActionType, FileRouter, RequestLike } from "./types";

const fileCountLimitHit = (
  files: string[],
  routeConfig: ExpandedRouteConfig,
) => {
  const counts: Record<string, number> = {};

  files.forEach((file) => {
    const type = getTypeFromFileName(
      file,
      Object.keys(routeConfig) as FileRouterInputKey[],
    ) as FileRouterInputKey;

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

if (process.env.NODE_ENV === "development") {
  console.log("[UT] UploadThing dev server is now running!");
}

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

type UploadThingResponse = {
  presignedUrl: { url: string; fields: Record<string, string> }; // ripped type from S3 package
  name: string;
  key: string;
}[];

export const buildRequestHandler = <TRouter extends FileRouter>(
  opts: RouterWithConfig<TRouter>,
) => {
  return async (input: {
    req: RequestLike;
    res?: unknown;
  }): Promise<
    UploadThingError | { status: 200; body?: UploadThingResponse }
  > => {
    const { req, res } = input;
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
      const reqBody = (await req.json()) as {
        file: UploadedFile;
        files: unknown;
        metadata: Record<string, unknown>;
        input?: Json;
      };

      await uploadable.resolver({
        file: reqBody.file,
        metadata: reqBody.metadata,
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

    switch (actionType) {
      case "upload": {
        const { files, input: userInput } = (await req.json()) as {
          files: string[];
          input: Json;
        };

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
        if (!Array.isArray(files) || !files.every((f) => typeof f === "string"))
          return new UploadThingError({
            code: "BAD_REQUEST",
            message: "Files must be a string array",
            cause: `Expected files to be of type 'string[]', got '${JSON.stringify(
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

        const uploadthingApiResponse = await fetch(
          generateUploadThingURL("/api/prepareUpload"),
          {
            method: "POST",
            body: JSON.stringify({
              files: files,

              routeConfig: parsedConfig,

              metadata,
              callbackUrl: config?.callbackUrl ?? getUploadthingUrl(),
              callbackSlug: slug,
            }),
            headers: {
              "Content-Type": "application/json",
              "x-uploadthing-api-key": preferredOrEnvSecret,
              "x-uploadthing-version": UPLOADTHING_VERSION,
            },
          },
        );

        if (!uploadthingApiResponse.ok) {
          console.error("[UT] unable to get presigned urls");
          try {
            const error = (await uploadthingApiResponse.json()) as unknown;
            console.error(error);
            return new UploadThingError({
              code: "BAD_REQUEST",
              cause: error,
            });
          } catch (cause) {
            console.error("[UT] unable to parse response");
            return new UploadThingError({
              code: "URL_GENERATION_FAILED",
              message: "Unable to get presigned urls",
              cause,
            });
          }
        }

        // This is when we send the response back to the user's form so they can submit the files
        const parsedResponse =
          (await uploadthingApiResponse.json()) as UploadThingResponse;

        if (process.env.NODE_ENV === "development") {
          for (const file of parsedResponse) {
            void conditionalDevServer(file.key);
          }
        }

        return { body: parsedResponse, status: 200 };
      }
      case "failure": {
        const { fileKey } = (await req.json()) as {
          fileKey: string;
        };

        // Tell uploadthing to mark the upload as failed
        const uploadthingApiResponse = await fetch(
          generateUploadThingURL("/api/failureCallback"),
          {
            method: "POST",
            body: JSON.stringify({
              fileKey,
            }),
            headers: {
              "Content-Type": "application/json",
              "x-uploadthing-api-key": preferredOrEnvSecret,
              "x-uploadthing-version": UPLOADTHING_VERSION,
            },
          },
        );

        if (!uploadthingApiResponse.ok) {
          console.error("[UT] failed to mark upload as failed");
          try {
            const error = (await uploadthingApiResponse.json()) as unknown;
            console.error(error);
            return new UploadThingError({
              message: "Failed to mark upload as failed",
              code: "INTERNAL_SERVER_ERROR",
              cause: error,
            });
          } catch (cause) {
            console.error("[UT] unable to parse response");
            return new UploadThingError({
              code: "URL_GENERATION_FAILED",
              message: "Unable to get presigned urls",
              cause,
            });
          }
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
