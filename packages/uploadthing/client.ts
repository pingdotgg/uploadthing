/* eslint-disable @typescript-eslint/no-unsafe-argument */
/* eslint-disable @typescript-eslint/no-unsafe-member-access */
/* eslint-disable @typescript-eslint/no-unsafe-assignment */
import type { FileRouter } from "./server";

const createRequestPermsUrl = (config: { url?: string; slug: string }) => {
  const queryParams = `?actionType=upload&slug=${config.slug}`;

  return `${config?.url ?? "/api/uploadthing"}${queryParams}`;
};

export const DANGEROUS__uploadFiles = async <T extends string>(
  files: File[],
  endpoint: T,
  config?: {
    url?: string;
  },
) => {
  // Get presigned URL for S3 upload
  const s3ConnectionRes = await fetch(
    createRequestPermsUrl({ url: config?.url, slug: endpoint }),
    {
      method: "POST",
      body: JSON.stringify({
        files: files.map((f) => f.name),
      }),
    },
  ).then((res) => {
    // check for 200 response
    if (!res.ok) throw new Error("Failed to get presigned URLs");

    // attempt to parse response
    try {
      return res.json();
    } catch (e) {
      // response is not JSON
      console.error(e);
      throw new Error(`Failed to parse response as JSON. Got: ${res.body}`);
    }
  });

  if (!s3ConnectionRes || !Array.isArray(s3ConnectionRes))
    throw "No url received. How did you get here?";

  const fileUploadPromises = s3ConnectionRes.map(async (presigned: any) => {
    const file = files.find((f) => f.name === presigned.name);

    if (!file) {
      console.error("No file found for presigned URL", presigned);
      throw new Error("No file found for presigned URL");
    }
    const { url, fields } = presigned.presignedUrl;
    const formData = new FormData();

    // Give content type to blobs because S3 is dumb
    // check if content-type is one of the allowed types, or if not and blobs are allowed, use application/octet-stream
    if (presigned.fileType === file.type.split("/")[0]) {
      formData.append("Content-Type", file.type);
      console.log("FILE TYPE", file.type);
    } else if (presigned.fileType === "blob") {
      formData.append("Content-Type", "application/octet-stream");
      console.log("COERCING FILE TYPE TO BLOB");
      console.log("FILE TYPE", "application/octet-stream");
    }

    // Dump all values from response (+ the file itself) into form for S3 upload
    Object.entries({ ...fields, file: file }).forEach(([key, value]) => {
      formData.append(key, value as Blob);
    });

    // Do S3 upload
    const upload = await fetch(url, {
      method: "POST",
      body: formData,
      headers: new Headers({
        Accept: "application/xml",
      }),
    });

    if (!upload.ok) throw new Error("Upload failed.");
    // Generate a URL for the uploaded image since AWS won't give me one
    const genUrl =
      "https://uploadthing.com/f/" + encodeURIComponent(fields["key"]);

    console.log("URL for uploaded image", genUrl);

    return {
      fileKey: presigned.key,
      fileUrl: genUrl,
    };
  });

  return Promise.all(fileUploadPromises) as Promise<
    { fileUrl: string; fileKey: string }[]
  >;
};

export type UploadFileType<T extends string> = typeof DANGEROUS__uploadFiles<T>;

export const genUploader = <
  TRouter extends FileRouter,
>(): typeof DANGEROUS__uploadFiles<
  keyof TRouter extends string ? keyof TRouter : string
> => {
  return DANGEROUS__uploadFiles;
};

export const classNames = (...classes: string[]) => {
  return classes.filter(Boolean).join(" ");
};

export const generateMimeTypes = (fileTypes: string[]) => {
  const accepted = fileTypes.map((type) =>
    {
      if (type === "blob") return  "blob"
      if (type === "pdf") return "application/pdf"
      else return `${type}/*`
    }
  );

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
