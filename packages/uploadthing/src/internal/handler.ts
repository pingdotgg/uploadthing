import type { NextApiResponse } from "next";

import {
  generateUploadThingURL,
  getTypeFromFileName,
  getUploadthingUrl,
  fillInputRouteConfig as parseAndExpandInputConfig,
  pollForFileData,
} from "@uploadthing/shared";
import type {
  ExpandedRouteConfig,
  FileData,
  FileRouterInputKey,
  UploadedFile,
} from "@uploadthing/shared";

import { UPLOADTHING_VERSION } from "../constants";
import type { Json } from "../parser";
import { getParseFn } from "../parser";
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

  return Object.keys(counts).some((key) => {
    const count = counts[key as FileRouterInputKey];
    if (count === 0) return false;

    const limit = routeConfig[key as FileRouterInputKey]?.maxFileCount;
    if (!limit) {
      console.error(routeConfig, key);
      throw new Error("invalid config during file count");
    }

    return count > limit;
  });
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
  throw new Error("File took too long to upload");
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
    uploadthingHook?: string;
    slug?: string;
    actionType?: string;
    req: Partial<Request> & { json: Request["json"] };
    res?: TRuntime extends "pages" ? NextApiResponse : undefined;
  }) => {
    const { router, config } = opts;
    const preferredOrEnvSecret =
      config?.uploadthingSecret ?? process.env.UPLOADTHING_SECRET;
    const { uploadthingHook, slug, req, res, actionType } = input;

    if (!slug) throw new Error("we need a slug");

    if (!preferredOrEnvSecret) {
      throw new Error(
        `Please set your preferred secret in ${slug} router's config or set UPLOADTHING_SECRET in your env file`,
      );
    }

    const uploadable = router[slug];
    if (!uploadable) {
      return { status: 404 };
    }

    if (uploadthingHook && uploadthingHook === "callback") {
      const reqBody = (await req.json()) as {
        file: UploadedFile;
        files: unknown;
        metadata: Record<string, unknown>;
        input?: Json;
      };

      // This is when we receive the webhook from uploadthing
      await uploadable.resolver({
        file: reqBody.file,
        metadata: reqBody.metadata,
      });

      return { status: 200 };
    }

    if (!actionType || ["upload", "failure"].includes(actionType)) {
      // This would either be someone spamming
      // or the AWS webhook
      return { status: 404 };
    }

    try {
      if (actionType === "upload") {
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
          return { status: 400, mesage: "Invalid input" };
        }

        const metadata = await uploadable._def.middleware({
          // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment
          req: req as any,
          res,
          input: parsedInput,
        });

        // Validate without Zod (for now)
        if (!Array.isArray(files) || !files.every((f) => typeof f === "string"))
          throw new Error("Need file array");

        // FILL THE ROUTE CONFIG so the server only has one happy path
        const parsedConfig = parseAndExpandInputConfig(
          uploadable._def.routerConfig,
        );

        const limitHit = fileCountLimitHit(files, parsedConfig);

        if (limitHit) throw new Error("Too many files");

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
          } catch (e) {
            console.error("[UT] unable to parse response");
          }
          throw new Error("[UT] ending upload");
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
      } else if (actionType === "failure") {
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
          console.error("[UT] failed to mark upload as failed");
          try {
            const error = (await uploadthingApiResponse.json()) as unknown;
            console.error(error);
          } catch (e) {
            console.error("[UT] unable to parse response");
          }
          throw new Error("[UT] Failed to mark upload as failed.");
        }

        // TODO: onUploadFailure() callback if it exists
        // uploadable.onUploadFailure?.();

        return { status: 200 };
      }
    } catch (e) {
      console.error("[UT] middleware failed to run");
      console.error(e);

      return { status: 400, message: (e as Error).toString() };
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
