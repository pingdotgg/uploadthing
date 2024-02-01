import { process } from "std-env";
import type { File as UndiciFile } from "undici";

import type {
  ACL,
  ContentDisposition,
  FetchEsque,
  Json,
} from "@uploadthing/shared";
import {
  generateUploadThingURL,
  pollForFileData,
  UploadThingError,
} from "@uploadthing/shared";

import { UPLOADTHING_VERSION } from "../constants";
import { logDuration, logger } from "../internal/logger";
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
    acl?: ACL;
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
  logger.debug("Getting presigned URLs for files", fileData);
  const getPresignedStart = Date.now();
  const res = await opts.fetch(generateUploadThingURL("/api/uploadFiles"), {
    method: "POST",
    headers: opts.utRequestHeaders,
    cache: "no-store",
    body: JSON.stringify({
      files: fileData,
      metadata: data.metadata,
      contentDisposition: data.contentDisposition,
      acl: data.acl,
    }),
  });

  if (!res.ok) {
    const error = await UploadThingError.fromResponse(res);
    logger.debug("Failed getting presigned URLs:", error);
    throw error;
  }

  const json = await res.json<{
    data: {
      presignedUrls: string[];
      key: string;
      fileUrl: string;
      fileType: string;
      uploadId: string;
      chunkSize: number;
      chunkCount: number;
    }[];
  }>();

  logger.debug(
    `Got presigned URLs ${logDuration(getPresignedStart)} :`,
    json.data,
  );

  logger.debug("Starting uploads...");
  const uploadsStart = Date.now();

  // Upload each file to S3 in chunks using multi-part uploads
  const uploads = await Promise.allSettled(
    data.files.map(async (file, i) => {
      const { presignedUrls, key, fileUrl, uploadId, chunkSize } = json.data[i];

      if (!presignedUrls || !Array.isArray(presignedUrls)) {
        logger.error(
          "Failed to generate presigned URL for file:",
          file,
          json.data[i],
        );
        throw new UploadThingError({
          code: "URL_GENERATION_FAILED",
          message: "Failed to generate presigned URL",
          cause: JSON.stringify(json.data[i]),
        });
      }

      logger.debug(
        "Uploading file",
        file.name,
        "with",
        presignedUrls.length,
        "chunks of size",
        chunkSize,
        "bytes each",
      );
      const uploadStart = Date.now();

      const etags = await Promise.all(
        presignedUrls.map(async (url, index) => {
          const offset = chunkSize * index;
          const end = Math.min(offset + chunkSize, file.size);
          const chunk = file.slice(offset, end);

          const partStart = Date.now();
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

          logger.debug(
            `Part", index + 1, "uploaded successfully ${logDuration(partStart)}:`,
            etag,
          );

          return { tag: etag, partNumber: index + 1 };
        }),
      );

      logger.debug(
        "File",
        file.name,
        `uploaded successfully ${logDuration(uploadStart)}. Notifying UploadThing to complete multipart upload.`,
      );

      // Complete multipart upload and poll for file to be available
      const completionStart = Date.now();
      await Promise.all([
        opts
          .fetch(generateUploadThingURL("/api/completeMultipart"), {
            method: "POST",
            body: JSON.stringify({
              fileKey: key,
              uploadId,
              etags,
            } satisfies UTEvents["multipart-complete"]),
            headers: opts.utRequestHeaders,
          })
          .then((completionRes) => {
            logger.debug(
              `UploadThing responsed with status ${logDuration(completionStart)}:`,
              completionRes.status,
            );
          }),
        pollForFileData(
          {
            url: generateUploadThingURL(`/api/pollUpload/${key}`),
            apiKey: opts.utRequestHeaders["x-uploadthing-api-key"],
            sdkVersion: UPLOADTHING_VERSION,
            fetch: opts.fetch,
          },
          (_, tries) => {
            logger.debug(`Polling took ${tries} tries before succeeding.`);
          },
        ).then(() => {
          logger.debug(`Polling complete ${logDuration(completionStart)}.`);
        }),
      ]);

      return {
        key,
        url: fileUrl,
        name: file.name,
        size: file.size,
      };
    }),
  );

  logger.debug(
    `All uploads complete ${logDuration(uploadsStart)}, aggregating results...`,
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

type TimeShort = "s" | "m" | "h" | "d";
type TimeLong = "second" | "minute" | "hour" | "day";
type SuggestedNumbers = 2 | 3 | 4 | 5 | 6 | 7 | 10 | 15 | 30 | 60;
// eslint-disable-next-line @typescript-eslint/ban-types
type AutoCompleteableNumber = SuggestedNumbers | (number & {});
export type Time =
  | number
  | `1${TimeShort}`
  | `${AutoCompleteableNumber}${TimeShort}`
  | `1 ${TimeLong}`
  | `${AutoCompleteableNumber} ${TimeLong}s`;

export function parseTimeToSeconds(time: Time) {
  const match = time.toString().split(/(\d+)/).filter(Boolean);
  const num = Number(match[0]);
  const unit = (match[1] ?? "s").trim().slice(0, 1) as TimeShort;

  const multiplier = {
    s: 1,
    m: 60,
    h: 3600,
    d: 86400,
  }[unit];

  return num * multiplier;
}
