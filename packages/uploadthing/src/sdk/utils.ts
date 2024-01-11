import type { File as UndiciFile } from "undici";

import { UploadThingError } from "@uploadthing/shared/error";
import type {
  ContentDisposition,
  FetchEsque,
  Json,
} from "@uploadthing/shared/types";
import {
  generateUploadThingURL,
  pollForFileData,
} from "@uploadthing/shared/utils";

import { UPLOADTHING_VERSION } from "../constants";
import { uploadPart } from "../internal/multi-part";
import type { UTEvents } from "../server";

export function guardServerOnly() {
  if (typeof window !== "undefined") {
    throw new UploadThingError({
      code: "INTERNAL_SERVER_ERROR",
      message: "The `utapi` can only be used on the server.",
    });
  }
}

export function getApiKeyOrThrow(apiKey?: string) {
  if (apiKey) return apiKey;
  if (process.env.UPLOADTHING_SECRET) return process.env.UPLOADTHING_SECRET;

  throw new UploadThingError({
    code: "MISSING_ENV",
    message: "Missing `UPLOADTHING_SECRET` env variable.",
  });
}

export type FileEsque = (Blob & { name: string }) | UndiciFile;

export type UploadData = {
  key: string;
  url: string;
  name: string;
  size: number;
};

export type UploadError = {
  code: string;
  message: string;
  data: any;
};

export type UploadFileResponse =
  | { data: UploadData; error: null }
  | { data: null; error: UploadError };

export const uploadFilesInternal = async (
  data: {
    files: FileEsque[];
    metadata: Json;
    contentDisposition: ContentDisposition;
  },
  opts: {
    fetch: FetchEsque;
    utRequestHeaders: Record<string, string>;
  },
) => {
  // Request presigned URLs for each file
  const fileData = data.files.map((file) => ({
    name: file.name ?? "unnamed-blob",
    type: file.type,
    size: file.size,
  }));
  const res = await opts.fetch(generateUploadThingURL("/api/uploadFiles"), {
    method: "POST",
    headers: opts.utRequestHeaders,
    cache: "no-store",
    body: JSON.stringify({
      files: fileData,
      metadata: data.metadata,
      contentDisposition: data.contentDisposition,
    }),
  });

  if (!res.ok) {
    const error = await UploadThingError.fromResponse(res);
    throw error;
  }

  const clonedRes = res.clone(); // so that `UploadThingError.fromResponse()` can consume the body again
  const json = await res.json<
    | {
        data: {
          presignedUrls: string[];
          key: string;
          fileUrl: string;
          fileType: string;
          uploadId: string;
          chunkSize: number;
          chunkCount: number;
        }[];
      }
    | { error: string }
  >();

  if ("error" in json) {
    const error = await UploadThingError.fromResponse(clonedRes);
    throw error;
  }

  // Upload each file to S3 in chunks using multi-part uploads
  const uploads = await Promise.allSettled(
    data.files.map(async (file, i) => {
      const { presignedUrls, key, fileUrl, uploadId, chunkSize } = json.data[i];

      if (!presignedUrls || !Array.isArray(presignedUrls)) {
        throw new UploadThingError({
          code: "URL_GENERATION_FAILED",
          message: "Failed to generate presigned URL",
          cause: JSON.stringify(json.data[i]),
        });
      }

      const etags = await Promise.all(
        presignedUrls.map(async (url, index) => {
          const offset = chunkSize * index;
          const end = Math.min(offset + chunkSize, file.size);
          const chunk = file.slice(offset, end);

          const etag = await uploadPart({
            fetch: opts.fetch,
            url,
            chunk: chunk as Blob,
            contentDisposition: data.contentDisposition,
            contentType: file.type,
            fileName: file.name,
            maxRetries: 10,
            key,
            utRequestHeaders: opts.utRequestHeaders,
          });

          return { tag: etag, partNumber: index + 1 };
        }),
      );

      // Complete multipart upload
      await opts.fetch(generateUploadThingURL("/api/completeMultipart"), {
        method: "POST",
        body: JSON.stringify({
          fileKey: key,
          uploadId,
          etags,
        } satisfies UTEvents["multipart-complete"]),
        headers: opts.utRequestHeaders,
      });

      // Poll for file to be available
      await pollForFileData({
        url: generateUploadThingURL(`/api/pollUpload/${key}`),
        apiKey: opts.utRequestHeaders["x-uploadthing-api-key"],
        sdkVersion: UPLOADTHING_VERSION,
      });

      return {
        key,
        url: fileUrl,
        name: file.name,
        size: file.size,
      };
    }),
  );

  return uploads.map((upload) => {
    if (upload.status === "fulfilled") {
      const data = upload.value satisfies UploadData;
      return { data, error: null };
    }
    // We only throw UploadThingErrors, so this is safe
    const reason = upload.reason as UploadThingError;
    const error = UploadThingError.toObject(reason) satisfies UploadError;
    return { data: null, error };
  });
};
