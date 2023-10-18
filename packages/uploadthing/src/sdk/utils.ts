import type { File as UndiciFile } from "undici";

import type { ContentDisposition, FetchEsque, Json } from "@uploadthing/shared";
import {
  generateUploadThingURL,
  pollForFileData,
  UploadThingError,
} from "@uploadthing/shared";

import { maybeParseResponseXML } from "../internal/s3-error-parser";

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

      const maxRetries = 10;
      const etags = await Promise.all(
        presignedUrls.map(async (url, partNumber) => {
          let retryCount = 0;

          const offset = chunkSize * partNumber;
          const end = Math.min(offset + chunkSize, file.size);
          const chunk = file.slice(offset, end);

          async function makeRequest() {
            const s3Res = await opts.fetch(url, {
              method: "PUT",
              body: chunk as Blob, // omit weird union of different blobs
              headers: {
                "Content-Type": file.type,
                "Content-Disposition": [
                  data.contentDisposition,
                  `filename="${file.name}"`,
                  `filename*=UTF-8''${file.name}`,
                ].join("; "),
              },
            });

            if (s3Res.ok) {
              const etag = s3Res.headers.get("Etag");
              if (!etag) {
                throw new UploadThingError({
                  code: "UPLOAD_FAILED",
                  message: "Missing Etag header from uploaded part",
                });
              }

              console.log(`Uploaded part ${partNumber} with etag ${etag}`);
              return etag.replace(/"/g, "");
            }

            if (retryCount < maxRetries) {
              retryCount++;
              // Retry after exponential backoff
              const delay = 2 ** retryCount * 1000;
              await new Promise((r) => setTimeout(r, delay));
              console.log(
                `Retrying part ${partNumber} after ${delay}ms, attempt ${
                  retryCount + 1
                }/${maxRetries}`,
              );
              return makeRequest();
            }

            // Max retries exceeded, tell UT server that upload failed
            await opts.fetch(generateUploadThingURL("/api/failureCallback"), {
              method: "POST",
              body: JSON.stringify({
                fileKey: key,
              }),
              headers: opts.utRequestHeaders,
            });

            const text = await s3Res.text();
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
              cause: s3Res,
            });
          }

          return { tag: await makeRequest(), partNumber: partNumber + 1 };
        }),
      );

      // Complete multipart upload
      const completeRes = await opts.fetch(
        generateUploadThingURL("/api/completeMultipart"),
        {
          method: "POST",
          body: JSON.stringify({
            key,
            uploadId,
            etags,
          }),
          headers: opts.utRequestHeaders,
        },
      );
      console.log("Complete multipart upload response:", completeRes);

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
