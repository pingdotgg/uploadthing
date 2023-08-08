import type { Json } from "@uploadthing/shared";
import {
  generateUploadThingURL,
  pollForFileData,
  UploadThingError,
} from "@uploadthing/shared";

export type FileEsque = Blob & { name: string };

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

export const uploadFilesInternal = async (
  data: {
    files: FileEsque[];
    metadata: Json;
  },
  opts: {
    apiKey: string;
    utVersion: string;
  },
) => {
  // Request presigned URLs for each file
  const fileData = data.files.map((file) => ({
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
    data.files.map(async (file, i) => {
      const { presignedUrl, fields, key, fileUrl } = json.data[i];

      if (!presignedUrl || !fields) {
        console.log(
          "Error: Failed to generate presigned URL. Caused by",
          json.data[i],
        );
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
        console.log(
          "Error: Failed to upload file to storage provider. Caused by",
          s3res,
        );
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
