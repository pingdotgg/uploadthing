import type { AnyRuntime, FileRouter, FileSize } from "../types";
import type { NextApiRequest, NextApiResponse } from "next";

const UPLOADTHING_VERSION = require("../../package.json").version;

const UNITS = ["B", "KB", "MB", "GB"] as const;
type SizeUnit = (typeof UNITS)[number];

export const fileSizeToBytes = (input: string) => {
  const regex = new RegExp(`^(\\d+)(\\.\\d+)?\\s*(${UNITS.join("|")})$`, "i");
  const match = input.match(regex);

  if (!match) {
    return new Error("Invalid file size format");
  }

  const sizeValue = parseFloat(match[1]);
  const sizeUnit = match[3].toUpperCase() as SizeUnit;

  if (!UNITS.includes(sizeUnit)) {
    throw new Error("Invalid file size unit");
  }
  const bytes = sizeValue * Math.pow(1024, UNITS.indexOf(sizeUnit));
  return Math.floor(bytes);
};

const generateUploadThingURL = (path: `/${string}`) => {
  const host = process.env.CUSTOM_INFRA_URL ?? "https://uploadthing.com";
  return `${host}${path}`;
};

if (process.env.NODE_ENV !== "development") {
  console.log("[UT] UploadThing dev server is now running!");
}

const isValidResponse = (response: Response) => {
  if (!response.ok) return false;
  if (response.status >= 400) return false;
  if (!response.headers.has("x-uploadthing-version")) return false;

  return true;
};

const withExponentialBackoff = async <T>(
  doTheThing: () => Promise<T | null>,
  MAXIMUM_BACKOFF_MS = 64 * 1000,
  MAX_RETRIES = 20
): Promise<T | null> => {
  let tries = 0;
  let backoffMs = 500;
  let backoffFuzzMs = 0;

  let result = null;
  while (tries <= MAX_RETRIES) {
    result = await doTheThing();
    if (result !== null) return result;

    tries += 1;
    backoffMs = Math.min(MAXIMUM_BACKOFF_MS, backoffMs * 2);
    backoffFuzzMs = Math.floor(Math.random() * 500);

    if (tries > 3) {
      console.error(
        `[UT] Call unsuccessful after ${tries} tries. Retrying in ${Math.floor(
          backoffMs / 1000
        )} seconds...`
      );
    }

    await new Promise((r) => setTimeout(r, backoffMs + backoffFuzzMs));
  }

  return null;
};

const conditionalDevServer = async (fileKey: string) => {
  if (process.env.NODE_ENV !== "development") return;

  const queryUrl = generateUploadThingURL(`/api/pollUpload/${fileKey}`);

  const fileData = await withExponentialBackoff(async () => {
    const res = await fetch(queryUrl);
    const json = await res.json();

    const file = json.fileData;

    if (json.status !== "done") return null;

    let callbackUrl = file.callbackUrl + `?slug=${file.callbackSlug}`;
    if (!callbackUrl.startsWith("http")) callbackUrl = "http://" + callbackUrl;

    console.log("[UT] SIMULATING FILE UPLOAD WEBHOOK CALLBACK", callbackUrl);

    // TODO: Check that we "actually hit our endpoint" and throw a loud error if we didn't
    const response = await fetch(callbackUrl, {
      method: "POST",
      body: JSON.stringify({
        status: "uploaded",
        metadata: JSON.parse(file.metadata ?? "{}"),
        file: {
          url: `https://uploadthing.com/f/${encodeURIComponent(fileKey ?? "")}`,
          key: fileKey ?? "",
          name: file.fileName,
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
        fileKey
      );
    }
    return file;
  });

  if (fileData !== null) return fileData;

  console.error(`[UT] Failed to simulate callback for file ${fileKey}`);
  throw new Error("File took too long to upload");
};

const GET_DEFAULT_URL = () => {
  const vcurl = process.env.VERCEL_URL;
  if (vcurl) return `https://${vcurl}/api/uploadthing`; // SSR should use vercel url

  return `http://localhost:${process.env.PORT ?? 3000}/api/uploadthing`; // dev SSR should use localhost
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
  TRuntime extends AnyRuntime
>(
  opts: RouterWithConfig<TRouter>
) => {
  return async (input: {
    uploadthingHook?: string;
    slug?: string;
    actionType?: string;
    req: TRuntime extends "pages" ? NextApiRequest : Partial<Request>;
    res?: TRuntime extends "pages" ? NextApiResponse : undefined;
  }) => {
    const { router, config } = opts;
    const preferredOrEnvSecret =
      config?.uploadthingSecret ?? process.env.UPLOADTHING_SECRET;

    if (!preferredOrEnvSecret) {
      throw new Error(
        "Please set your preferred secret in the router's config or set UPLOADTHING_SECRET in your env file"
      );
    }

    const { uploadthingHook, slug, req, res, actionType } = input;
    if (!slug) throw new Error("we need a slug");
    const uploadable = router[slug];

    if (!uploadable) {
      return { status: 404 };
    }

    const reqBody =
      "body" in req && typeof req.body === "string"
        ? JSON.parse(req.body)
        : await (req as Request).json();

    if (uploadthingHook && uploadthingHook === "callback") {
      // This is when we receive the webhook from uploadthing
      await uploadable.resolver({
        file: reqBody.file,
        metadata: reqBody.metadata,
      });

      return { status: 200 };
    }

    if (!actionType || actionType !== "upload") {
      // This would either be someone spamming
      // or the AWS webhook

      return { status: 404 };
    }

    try {
      const { files } = reqBody;
      // @ts-expect-error TODO: Fix this
      const metadata = await uploadable._def.middleware(req as Request, res);

      // Once that passes, persist in DB

      // Validate without Zod (for now)
      if (!Array.isArray(files) || !files.every((f) => typeof f === "string"))
        throw new Error("Need file array");

      // TODO: Make this a function
      const uploadthingApiResponse = await fetch(
        generateUploadThingURL("/api/prepareUpload"),
        {
          method: "POST",
          body: JSON.stringify({
            files: files,
            fileTypes: uploadable._def.fileTypes,
            metadata,
            callbackUrl: config?.callbackUrl ?? GET_DEFAULT_URL(),
            callbackSlug: slug,
            maxFileSize: fileSizeToBytes(uploadable._def.maxSize ?? "16MB"),
          }),
          headers: {
            "Content-Type": "application/json",
            "x-uploadthing-api-key": preferredOrEnvSecret,
            "x-uploadthing-version": UPLOADTHING_VERSION,
          },
        }
      );

      if (!uploadthingApiResponse.ok) {
        console.error("[UT] unable to get presigned urls");
        try {
          const error = await uploadthingApiResponse.json();
          console.error(error);
        } catch (e) {
          console.error("[UT] unable to parse response");
        }
        throw new Error("ending upload");
      }

      // This is when we send the response back to our form so it can submit the files

      const parsedResponse = (await uploadthingApiResponse.json()) as {
        presignedUrl: { url: string; fields: Record<string, string> }; // ripped type from S3 package
        name: string;
        key: string;
      }[];

      if (process.env.NODE_ENV === "development") {
        parsedResponse.forEach((file) => {
          conditionalDevServer(file.key);
        });
      }

      return { body: parsedResponse, status: 200 };
    } catch (e) {
      console.error("[UT] middleware failed to run");
      console.error(e);

      return { status: 400, message: (e as Error).toString() };
    }
  };
};

export const buildPermissionsInfoHandler = <TRouter extends FileRouter>(
  opts: RouterWithConfig<TRouter>
) => {
  return () => {
    const r = opts.router;

    const permissions = Object.keys(r).map((k) => {
      const route = r[k];
      return {
        slug: k as keyof TRouter,
        maxSize: route._def.maxSize,
        fileTypes: route._def.fileTypes,
      };
    });

    return permissions;
  };
};
