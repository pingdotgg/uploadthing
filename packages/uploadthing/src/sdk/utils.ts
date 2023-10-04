import type { File as UndiciFile } from "undici";

import type { Json } from "@uploadthing/shared";
import {
  generateUploadThingURL,
  pollForFileData,
  UploadThingError,
} from "@uploadthing/shared";

import { maybeParseResponseXML } from "../internal/s3-error-parser";
import type { FetchEsque } from "./types";

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
    }),
  });

  if (!res.ok) {
    const error = await UploadThingError.fromResponse(res as Response);
    throw error;
  }

  const clonedRes = res.clone(); // so that `UploadThingError.fromResponse()` can consume the body again
  const json = await res.json<
    | {
        data: {
          presignedUrl: string; // url to post to
          fields: Record<string, string>;
          key: string;
          fileUrl: string; // the final url of the file after upload
        }[];
      }
    | { error: string }
  >();

  if ("error" in json) {
    const error = await UploadThingError.fromResponse(clonedRes as Response);
    throw error;
  }

  // Upload each file to S3
  const uploads = await Promise.allSettled(
    data.files.map(async (file, i) => {
      const { presignedUrl, fields, key, fileUrl } = json.data[i];

      if (!presignedUrl || !fields) {
        throw new UploadThingError({
          code: "URL_GENERATION_FAILED",
          message: "Failed to generate presigned URL",
          cause: JSON.stringify(json.data[i]),
        });
      }

      const formData = new FormData();
      formData.append("Content-Type", file.type);
      Object.entries(fields).forEach(([key, value]) => {
        formData.append(key, value);
      });

      formData.append(
        "file",
        // Handles case when there is no file name
        file.name
          ? (file as File)
          : Object.assign(file as File, { name: "unnamed-blob" }),
      );

      // Do S3 upload
      const s3res = await opts.fetch(presignedUrl, {
        method: "POST",
        body: formData,
        headers: new Headers({
          Accept: "application/xml",
        }),
      });

      if (!s3res.ok) {
        // tell uploadthing infra server that upload failed
        await opts.fetch(generateUploadThingURL("/api/failureCallback"), {
          method: "POST",
          body: JSON.stringify({
            fileKey: fields.key,
          }),
          headers: opts.utRequestHeaders,
        });

        const text = await s3res.text();
        const parsed = maybeParseResponseXML(text);
        if (parsed?.message) {
          throw new UploadThingError({
            code: "UPLOAD_FAILED",
            message: parsed.message,
          });
        }
        throw new UploadThingError({
          code: "UPLOAD_FAILED",
          message: "Failed to upload file to storage provider",
          cause: s3res,
        });
      }

      // Poll for file to be available
      await pollForFileData(key);

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
