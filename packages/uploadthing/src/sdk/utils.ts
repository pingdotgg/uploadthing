import type { Json } from "@uploadthing/shared";
import {
  generateUploadThingURL,
  pollForFileData,
  UploadThingError,
} from "@uploadthing/shared";

import type { FailedUpload, FileEsque, SuccessUpload, Upload } from "./types";

export const uploadFilesInternal = async (
  data: {
    files: FileEsque | FileEsque[];
    metadata: Json;
  },
  opts: {
    apiKey: string;
    utVersion: string;
  },
) => {
  const filesToUpload: FileEsque[] = Array.isArray(data.files)
    ? data.files
    : [data.files];

  // Request presigned URLs for each file
  const fileData = filesToUpload.map((file) => ({
    name: file.name,
    type: file.type,
    size: file.size,
  }));
  const res = await fetch(generateUploadThingURL("/api/uploadFiles"), {
    method: "POST",
    headers: {
      "x-uploadthing-api-key": opts.apiKey,
      "x-uploadthing-version": opts.utVersion,
    },
    cache: "no-store",
    body: JSON.stringify({
      files: fileData,
      metadata: data.metadata,
    }),
  });

  const json = (await res.json()) as
    | {
        data: {
          presignedUrl: string; // url to post to
          fields: Record<string, string>;
          key: string;
          fileUrl: string; // the final url of the file after upload
        }[];
      }
    | { error: string };

  if (!res.ok || "error" in json) {
    throw UploadThingError.fromResponse(res);
  }

  // Upload each file to S3
  const uploads = await Promise.allSettled(
    filesToUpload.map(async (file, i) => {
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
      formData.append("file", file);

      // Do S3 upload
      const s3res = await fetch(presignedUrl, {
        method: "POST",
        body: formData,
        headers: new Headers({
          Accept: "application/xml",
        }),
      });

      if (!s3res.ok) {
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
      } as Upload;
    }),
  );

  if (Array.isArray(data.files)) {
    return uploads.map((upload) => adaptResponse(upload));
  } else {
    const [upload] = uploads;

    return adaptResponse(upload);
  }
};

const adaptResponse = (upload: PromiseSettledResult<Upload>) => {
  if (upload.status === "fulfilled") {
    return { data: upload.value, error: null } as SuccessUpload;
  }
  return {
    data: null,
    error: UploadThingError.toObject(upload.reason as UploadThingError),
  } as FailedUpload;
};
