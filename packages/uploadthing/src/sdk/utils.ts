import type { Json } from "@uploadthing/shared";
import { generateUploadThingURL, pollForFileData } from "@uploadthing/shared";

export type FileEsque = Blob & { name: string };

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
    const message = "error" in json ? json.error : "Unknown error";
    throw new Error(message);
  }

  // Upload each file to S3
  const uploads = await Promise.allSettled(
    data.files.map(async (file, i) => {
      const { presignedUrl, fields, key, fileUrl } = json.data[i];

      if (!presignedUrl || !fields) {
        throw new Error("Failed to upload file");
      }

      const formData = new FormData();
      Object.entries(fields).forEach(([key, value]) => {
        formData.append(key, value);
      });
      formData.append("file", file);
      formData.append("Content-Type", file.type);

      const s3res = await fetch(presignedUrl, {
        method: "POST",
        body: formData,
      });

      if (!s3res.ok) {
        throw new Error("Failed to upload file");
      }

      // Poll for file to be available
      await pollForFileData(key);

      return {
        key,
        url: fileUrl,
      };
    }),
  );

  return uploads.map((upload) => {
    if (upload.status === "fulfilled") {
      return { data: upload.value, error: null };
    }
    return { data: null, error: upload.reason as Error };
  });
};
