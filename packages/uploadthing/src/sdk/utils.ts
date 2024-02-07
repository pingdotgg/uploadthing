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
import type {
  MPUResponse,
  PSPResponse,
  UploadThingResponse,
} from "../internal/handler";
import { logger } from "../internal/logger";
import { uploadPart } from "../internal/multi-part";
import type { UTEvents } from "../internal/types";

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

export type FileEsque =
  | (Blob & { name: string; customId?: string })
  | UndiciFile;

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
    ...("customId" in file ? { customId: file.customId } : {}),
  }));
  logger.debug("Getting presigned URLs for files", fileData);
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
    data: UploadThingResponse;
  }>();

  logger.debug("Got presigned URLs:", json.data);
  logger.debug("Starting uploads...");

  // Upload each file to S3 in chunks using multi-part uploads
  const uploads = await Promise.allSettled(
    data.files.map(async (file, i) => {
      const presigned = json.data[i];

      if (!presigned) {
        logger.error(
          "Failed to generate presigned URL for file:",
          file,
          presigned,
        );
        throw new UploadThingError({
          code: "URL_GENERATION_FAILED",
          message: "Failed to generate presigned URL",
          cause: JSON.stringify(presigned),
        });
      }

      if ("urls" in presigned) {
        await uploadMultipart(file, presigned, { ...opts });
      } else {
        await uploadPresignedPost(file, presigned, { ...opts });
      }

      // Poll for file to be available
      logger.debug("Polling for file data...");
      await pollForFileData({
        url: generateUploadThingURL(`/api/pollUpload/${presigned.key}`),
        apiKey: opts.utRequestHeaders["x-uploadthing-api-key"],
        sdkVersion: UPLOADTHING_VERSION,
        fetch: opts.fetch,
      });
      logger.debug("Polling complete.");

      return {
        key: presigned.key,
        url: presigned.fileUrl,
        name: file.name,
        size: file.size,
      };
    }),
  );

  logger.debug("All uploads complete, aggregating results...");

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

async function uploadMultipart(
  file: FileEsque,
  presigned: MPUResponse,
  opts: {
    fetch: FetchEsque;
    utRequestHeaders: Record<string, string>;
  },
) {
  logger.debug(
    "Uploading file",
    file.name,
    "with",
    presigned.urls.length,
    "chunks of size",
    presigned.chunkSize,
    "bytes each",
  );

  const etags = await Promise.all(
    presigned.urls.map(async (url, index) => {
      const offset = presigned.chunkSize * index;
      const end = Math.min(offset + presigned.chunkSize, file.size);
      const chunk = file.slice(offset, end);

      const etag = await uploadPart({
        fetch: opts.fetch,
        url,
        chunk: chunk as Blob,
        contentDisposition: presigned.contentDisposition,
        contentType: file.type,
        fileName: file.name,
        maxRetries: 10,
        key: presigned.key,
        utRequestHeaders: opts.utRequestHeaders,
      });

      logger.debug("Part", index + 1, "uploaded successfully:", etag);

      return { tag: etag, partNumber: index + 1 };
    }),
  );

  logger.debug(
    "File",
    file.name,
    "uploaded successfully. Notifying UploadThing to complete multipart upload.",
  );

  // Complete multipart upload
  const completionRes = await opts.fetch(
    generateUploadThingURL("/api/completeMultipart"),
    {
      method: "POST",
      body: JSON.stringify({
        fileKey: presigned.key,
        uploadId: presigned.uploadId,
        etags,
      } satisfies UTEvents["multipart-complete"]),
      headers: opts.utRequestHeaders,
    },
  );

  logger.debug("UploadThing responsed with status:", completionRes.status);
}

async function uploadPresignedPost(
  file: FileEsque,
  presigned: PSPResponse,
  opts: {
    fetch: FetchEsque;
  },
) {
  logger.debug("Uploading file", file.name, "using presigned POST URL");

  const formData = new FormData();
  Object.entries(presigned.fields).forEach(([k, v]) => formData.append(k, v));
  formData.append("file", file as Blob); // File data **MUST GO LAST**

  const res = await opts.fetch(presigned.url, {
    method: "POST",
    body: formData,
    headers: new Headers({
      Accept: "application/xml",
    }),
  });

  if (!res.ok) {
    const text = await res.text();
    logger.error("Failed to upload file:", text);
    throw new UploadThingError({
      code: "UPLOAD_FAILED",
      message: "Failed to upload file",
      cause: text,
    });
  }

  logger.debug("File", file.name, "uploaded successfully");
}

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
