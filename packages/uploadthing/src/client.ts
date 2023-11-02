import {
  pollForFileData,
  safeParseJSON,
  UploadThingError,
} from "@uploadthing/shared";

import { UPLOADTHING_VERSION } from "./constants";
import type { UploadThingResponse } from "./internal/handler";
import { uploadPartWithProgress } from "./internal/multi-part";
import type { FileRouter, inferEndpointInput } from "./internal/types";
import { createAPIRequestUrl, createUTReporter } from "./internal/ut-reporter";

/**
 * @internal
 * Shared helpers for our premade components that's reusable by multiple frameworks
 */
export * from "./internal/component-theming";

/** @internal */
export const INTERNAL_DO_NOT_USE__fatalClientError = (e: Error) =>
  new UploadThingError({
    code: "INTERNAL_CLIENT_ERROR",
    message: "Something went wrong. Please report this to UploadThing.",
    cause: e,
  });

type UploadFilesOptions<TRouter extends FileRouter> = {
  [TEndpoint in keyof TRouter]: {
    endpoint: TEndpoint;
    onUploadProgress?: ({
      file,
      progress,
    }: {
      file: string;
      progress: number;
    }) => void;
    onUploadBegin?: ({ file }: { file: string }) => void;
    input?: inferEndpointInput<TRouter[TEndpoint]>;

    files: File[];

    /**
     * URL to the UploadThing API endpoint
     * @example URL { http://localhost:3000/api/uploadthing }
     * @example URL { https://www.example.com/api/uploadthing }
     */
    url: URL;
  };
}[keyof TRouter];

export type UploadFileResponse = {
  name: string;
  size: number;
  key: string;
  url: string;
};

export const DANGEROUS__uploadFiles = async <TRouter extends FileRouter>(
  opts: UploadFilesOptions<TRouter>,
) => {
  const reportEventToUT = createUTReporter({
    endpoint: String(opts.endpoint),
    url: opts?.url,
  });

  // Get presigned URL for S3 upload
  const s3ConnectionRes = await fetch(
    createAPIRequestUrl({
      url: opts.url,
      slug: String(opts.endpoint),
      actionType: "upload",
    }),
    {
      method: "POST",
      body: JSON.stringify({
        files: opts.files.map((f) => ({ name: f.name, size: f.size })),
        input: opts.input,
      }),
      // Express requires Content-Type to be explicitly set to parse body properly
      headers: {
        "Content-Type": "application/json",
      },
    },
  ).then(async (res) => {
    // check for 200 response
    if (!res.ok) {
      const error = await UploadThingError.fromResponse(res);
      throw error;
    }

    const jsonOrError = await safeParseJSON<UploadThingResponse>(res);
    if (jsonOrError instanceof Error) {
      throw new UploadThingError({
        code: "BAD_REQUEST",
        message: jsonOrError.message,
        cause: res,
      });
    }
    return jsonOrError;
  });

  if (!s3ConnectionRes || !Array.isArray(s3ConnectionRes)) {
    throw new UploadThingError({
      code: "BAD_REQUEST",
      message: "No URL. How did you even get here?",
      cause: s3ConnectionRes,
    });
  }

  const fileUploadPromises = s3ConnectionRes.map(async (presigned) => {
    const file = opts.files.find((f) => f.name === presigned.fileName);

    if (!file) {
      console.error("No file found for presigned URL", presigned);
      throw new UploadThingError({
        code: "NOT_FOUND",
        message: "No file found for presigned URL",
        cause: `Expected file with name ${
          presigned.fileName
        } but got '${opts.files.join(",")}'`,
      });
    }

    const {
      presignedUrls,
      uploadId,
      chunkSize,
      contentDisposition,
      key,
      pollingUrl,
    } = presigned;

    let uploadedBytes = 0;

    let etags: { tag: string; partNumber: number }[];
    try {
      etags = await Promise.all(
        presignedUrls.map(async (url, index) => {
          const offset = chunkSize * index;
          const end = Math.min(offset + chunkSize, file.size);
          const chunk = file.slice(offset, end);

          const etag = await uploadPartWithProgress({
            url,
            chunk: chunk,
            contentDisposition,
            fileType: file.type,
            fileName: file.name,
            maxRetries: 10,
            onProgress: (delta) => {
              uploadedBytes += delta;
              const percent = (uploadedBytes / file.size) * 100;
              opts.onUploadProgress?.({ file: file.name, progress: percent });
            },
          });

          return { tag: etag, partNumber: index + 1 };
        }),
      );
    } catch (error) {
      await reportEventToUT("failure", {
        fileKey: key,
        uploadId,
        fileName: file.name,
        s3Error: (error as Error).toString(),
      });
      throw "unreachable"; // failure event will throw for us
    }

    // Tell the server that the upload is complete
    const uploadOk = await reportEventToUT("multipart-complete", {
      uploadId,
      fileKey: key,
      etags,
    });
    if (!uploadOk) {
      console.log("Failed to alert UT of upload completion");
      throw new UploadThingError({
        code: "UPLOAD_FAILED",
        message: "Failed to alert UT of upload completion",
      });
    }

    // Poll for file data, this way we know that the client-side onUploadComplete callback will be called after the server-side version
    await pollForFileData({
      url: pollingUrl,
      apiKey: null,
      sdkVersion: UPLOADTHING_VERSION,
    });

    return {
      name: file.name,
      size: file.size,
      key: presigned.key,
      url: "https://utfs.io/f/" + key,
    } satisfies UploadFileResponse;
  });

  return Promise.all(fileUploadPromises);
};

export const genUploader = <
  TRouter extends FileRouter,
>(): typeof DANGEROUS__uploadFiles<TRouter> => {
  return DANGEROUS__uploadFiles;
};

export const classNames = (...classes: (string | boolean)[]) => {
  return classes.filter(Boolean).join(" ");
};

export const generateMimeTypes = (fileTypes: string[]) => {
  const accepted = fileTypes.map((type) => {
    if (type === "blob") return "blob";
    if (type === "pdf") return "application/pdf";
    if (type.includes("/")) return type;
    else return `${type}/*`;
  });

  if (accepted.includes("blob")) {
    return undefined;
  }
  return accepted;
};

export const generateClientDropzoneAccept = (fileTypes: string[]) => {
  const mimeTypes = generateMimeTypes(fileTypes);

  if (!mimeTypes) return undefined;

  return Object.fromEntries(mimeTypes.map((type) => [type, []]));
};

// Returns a full URL to the dev's uploadthing endpoint
export function getFullApiUrl(maybeUrl?: string): URL {
  const base = (() => {
    if (typeof window !== "undefined") {
      return window.location.origin;
    }

    // eslint-disable-next-line @typescript-eslint/prefer-optional-chain
    if (typeof process !== "undefined" && process?.env?.VERCEL_URL) {
      return `https://${process.env.VERCEL_URL}`;
    }

    // @ts-expect-error - import meta is not defined in node
    // eslint-disable-next-line @typescript-eslint/no-unsafe-member-access
    if (import.meta.env?.VERCEL_URL) {
      // @ts-expect-error - import meta is not defined in node
      // eslint-disable-next-line @typescript-eslint/no-unsafe-member-access
      return `https://${import.meta.env.VERCEL_URL}`;
    }

    return "http://localhost:3000";
  })();

  try {
    const url = new URL(maybeUrl ?? "/api/uploadthing", base);
    if (url.pathname === "/") {
      url.pathname = "/api/uploadthing";
    }
    return url;
  } catch (err) {
    throw new Error(
      `Failed to parse '${maybeUrl}' as a URL. Make sure it's a valid URL or path`,
    );
  }
}
