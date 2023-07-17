import type { NextApiResponse } from "next";

import {
  generateUploadThingURL,
  getTypeFromFileName,
  getUploadthingUrl,
  fillInputRouteConfig as parseAndExpandInputConfig,
  pollForFileData,
  UploadThingError,
} from "@uploadthing/shared";
import type {
  ExpandedRouteConfig,
  FileData,
  FileRouterInputKey,
  Json,
  UploadedFile,
} from "@uploadthing/shared";

import { UPLOADTHING_VERSION } from "../constants";
import { getParseFn } from "./parser";
import type { AnyRuntime, FileRouter } from "./types";

const fileCountLimitHit = (
  files: string[],
  routeConfig: ExpandedRouteConfig,
) => {
  const counts: { [k: string]: number } = {};

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

const isValidResponse = (response: Response) => {
  if (!response.ok) return false;
  if (response.status >= 400) return false;
  if (!response.headers.has("x-uploadthing-version")) return false;

  return true;
};

const conditionalDevServer = async (fileKey: string) => {
  if (process.env.NODE_ENV !== "development") return;

  const fileData = await pollForFileData(
    fileKey,
    async (json: { fileData: FileData }) => {
      const file = json.fileData;

      let callbackUrl = file.callbackUrl + `?slug=${file.callbackSlug}`;
      if (!callbackUrl.startsWith("http"))
        callbackUrl = "http://" + callbackUrl;

      console.log("[UT] SIMULATING FILE UPLOAD WEBHOOK CALLBACK", callbackUrl);

      const response = await fetch(callbackUrl, {
        method: "POST",
        body: JSON.stringify({
          status: "uploaded",
          metadata: JSON.parse(file.metadata ?? "{}") as FileData["metadata"],
          file: {
            url: `https://uploadthing.com/f/${encodeURIComponent(fileKey)}`,
            key: fileKey,
            name: file.fileName,
            size: file.fileSize,
          },
        }),
        headers: {
          "uploadthing-hook": "callback",
        },
      });
      if (isValidResponse(response)) {
        console.log("[UT] Successfully simulated callback for file", fileKey);
      } else {
        console.error(
          "[UT] Failed to simulate callback for file. Is your webhook configured correctly?",
          fileKey,
        );
      }
      return file;
    },
  );

  if (fileData !== null) return fileData;

  console.error(`[UT] Failed to simulate callback for file ${fileKey}`);
  throw new UploadThingError({
    code: "UPLOAD_FAILED",
    message: "File took too long to upload",
  });
};

export type RouterWithConfig<TRouter extends FileRouter> = {
  router: TRouter;
  config?: {
    callbackUrl?: string;
    uploadthingId?: string;
    uploadthingSecret?: string;
  };
};

export const buildRequestHandler = <
  TRouter extends FileRouter,
  TRuntime extends AnyRuntime,
>(
  opts: RouterWithConfig<TRouter>,
) => {
  return async (input: {
    req: Partial<Request> & { json: Request["json"] };
    res?: TRuntime extends "pages" ? NextApiResponse : undefined;
  }) => {
    const { req, res } = input;
    const { router, config } = opts;
    const preferredOrEnvSecret =
      config?.uploadthingSecret ?? process.env.UPLOADTHING_SECRET;

    // Get inputs from query and params
    const params = new URL(req.url ?? "", getUploadthingUrl()).searchParams;
    const uploadthingHook = req.headers?.get("uploadthing-hook") ?? undefined;
    const slug = params.get("slug") ?? undefined;
    const actionType = params.get("actionType") ?? undefined;

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

    const reqBody = (await req.json()) as {
      file: UploadedFile;
      files: unknown;
      metadata: Record<string, unknown>;
      input?: Json;
    };

    if (uploadthingHook === "callback") {
      // This is when we receive the webhook from uploadthing
      await uploadable.resolver({
        file: reqBody.file,
        metadata: reqBody.metadata,
      });

      return { status: 200 };
    }

    if (!actionType || actionType !== "upload") {
      // This would either be someone spamming or the AWS webhook
      return new UploadThingError({
        code: "BAD_REQUEST",
        cause: `Invalid action type ${actionType}`,
        message: `Expected "upload" but got "${actionType}"`,
      });
    }

    try {
      const { files, input: userInput } = reqBody as {
        files: string[];
        input: Json;
      };

      // validate the input
      let parsedInput: Json = {};
      try {
        const inputParser = uploadable._def.inputParser;
        parsedInput = await getParseFn(inputParser)(userInput);
      } catch (error) {
        return new UploadThingError({
          code: "BAD_REQUEST",
          message: "Invalid input",
          cause: error,
        });
      }

      let metadata: Json = {};
      try {
        metadata = await uploadable._def.middleware({
          // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment
          req: req as any,
          res,
          input: parsedInput,
        });
      } catch (error) {
        return new UploadThingError({
          code: "BAD_REQUEST",
          message: "An error occured in the upload middleware",
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
      const parsedConfig = parseAndExpandInputConfig(
        uploadable._def.routerConfig,
      );

      const { limitHit, count, limit, type } = fileCountLimitHit(
        files,
        parsedConfig,
      );

      if (limitHit)
        return new UploadThingError({
          code: "BAD_REQUEST",
          message: "File limit exceeded",
          cause: `You uploaded ${count} files of type '${type}', but the limit for that type is ${limit}`,
        });

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
      const parsedResponse = (await uploadthingApiResponse.json()) as {
        presignedUrl: { url: string; fields: Record<string, string> }; // ripped type from S3 package
        name: string;
        key: string;
      }[];

      if (process.env.NODE_ENV === "development") {
        for (const file of parsedResponse) {
          void conditionalDevServer(file.key);
        }
      }

      return { body: parsedResponse, status: 200 };
    } catch (cause) {
      console.error("[UT] middleware failed to run");
      console.error(cause);
      return new UploadThingError({
        code: "BAD_REQUEST",
        message: `An error occured when running the middleware for the ${slug} route`,
        cause,
      });
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
