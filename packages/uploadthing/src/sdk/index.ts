import type { Json } from "@uploadthing/shared";
import { generateUploadThingURL } from "@uploadthing/shared";

import { UPLOADTHING_VERSION } from "../constants";
import { uploadFilesInternal } from "./utils";

function guardServerOnly() {
  if (typeof window !== "undefined") {
    throw new Error("The `utapi` can only be used on the server.");
  }
}

function getApiKeyOrThrow() {
  if (!process.env.UPLOADTHING_SECRET)
    throw new Error("Missing UPLOADTHING_SECRET env variable.");
  return process.env.UPLOADTHING_SECRET;
}

// File is just a Blob with a name property
type FileEsque = Blob & { name: string };

/**
 * @param {FileEsque | FileEsque[]} files The file(s) to upload
 * @param {Json} metadata JSON-parseable metadata to attach to the uploaded file(s)
 */
export const uploadFiles = async (
  files: FileEsque[] | FileEsque,
  metadata: Json = {},
) => {
  guardServerOnly();

  if (!Array.isArray(files)) files = [files];

  const formData = new FormData();
  files.forEach((file) => formData.append("files", file));
  formData.append("metadata", JSON.stringify(metadata));

  return uploadFilesInternal(formData, {
    apiKey: getApiKeyOrThrow(),
    utVersion: UPLOADTHING_VERSION,
  });
};

/**
 * @param {string} url The URL of the file to upload
 * @param {Json} metadata JSON-parseable metadata to attach to the uploaded file(s)
 */
export const uploadFileFromUrl = async (
  url: string | URL,
  metadata: Json = {},
) => {
  guardServerOnly();

  if (typeof url === "string") url = new URL(url);
  const filename = url.pathname.split("/").pop() ?? "unknown-filename";

  // Download the file on the user's server to avoid egress charges
  const fileResponse = await fetch(url);
  if (!fileResponse.ok) {
    throw new Error("Failed to download file");
  }
  const blob = await fileResponse.blob();

  const formData = new FormData();
  formData.append("files", blob, filename);
  formData.append("metadata", JSON.stringify(metadata));

  return uploadFilesInternal(formData, {
    apiKey: getApiKeyOrThrow(),
    utVersion: UPLOADTHING_VERSION,
  }).then((files) => files[0]);
};

/**
 * Request to delete files from UploadThing storage.
 * @param {string | string[]} fileKeys
 *
 * @example
 * await deleteFiles("2e0fdb64-9957-4262-8e45-f372ba903ac8_image.jpg");
 *
 * @example
 * await deleteFiles(["2e0fdb64-9957-4262-8e45-f372ba903ac8_image.jpg","1649353b-04ea-48a2-9db7-31de7f562c8d_image2.jpg"])
 */
export const deleteFiles = async (fileKeys: string[] | string) => {
  guardServerOnly();

  if (!Array.isArray(fileKeys)) fileKeys = [fileKeys];

  const res = await fetch(generateUploadThingURL("/api/deleteFile"), {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "x-uploadthing-api-key": getApiKeyOrThrow(),
      "x-uploadthing-version": UPLOADTHING_VERSION,
    },
    body: JSON.stringify({ fileKeys }),
  });

  if (!res.ok) {
    throw new Error("Failed to delete files");
  }

  return res.json() as Promise<{ success: boolean }>;
};

/**
 * Request file URLs from UploadThing storage.
 * @param {string | string[]} fileKeys
 *
 * @example
 * const data = await getFileUrls("2e0fdb64-9957-4262-8e45-f372ba903ac8_image.jpg");
 * console.log(data); // [{key: "2e0fdb64-9957-4262-8e45-f372ba903ac8_image.jpg", url: "https://uploadthing.com/f/2e0fdb64-9957-4262-8e45-f372ba903ac8_image.jpg"}]
 *
 * @example
 * const data = await getFileUrls(["2e0fdb64-9957-4262-8e45-f372ba903ac8_image.jpg","1649353b-04ea-48a2-9db7-31de7f562c8d_image2.jpg"])
 * console.log(data) // [{key: "2e0fdb64-9957-4262-8e45-f372ba903ac8_image.jpg", url: "https://uploadthing.com/f/2e0fdb64-9957-4262-8e45-f372ba903ac8_image.jpg" },{key: "1649353b-04ea-48a2-9db7-31de7f562c8d_image2.jpg", url: "https://uploadthing.com/f/1649353b-04ea-48a2-9db7-31de7f562c8d_image2.jpg"}]
 */
export const getFileUrls = async (fileKeys: string[] | string) => {
  guardServerOnly();

  if (!Array.isArray(fileKeys)) fileKeys = [fileKeys];

  const res = await fetch(generateUploadThingURL("/api/getFileUrl"), {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "x-uploadthing-api-key": getApiKeyOrThrow(),
      "x-uploadthing-version": UPLOADTHING_VERSION,
    },
    body: JSON.stringify({ fileKeys }),
  });

  if (!res.ok) {
    throw new Error("Failed to get file urls");
  }

  return res.json().then(({ data }) => data as { key: string; url: string }[]);
};

/**
 * Request file list from UploadThing storage.
 *
 * @example
 * const data = await listFiles();
 * console.log(data); // { key: "2e0fdb64-9957-4262-8e45-f372ba903ac8_image.jpg", id: "2e0fdb64-9957-4262-8e45-f372ba903ac8" }
 */
export const listFiles = async () => {
  guardServerOnly();

  // TODO: Implement filtering and pagination
  const res = await fetch(generateUploadThingURL("/api/listFiles"), {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "x-uploadthing-api-key": getApiKeyOrThrow(),
      "x-uploadthing-version": UPLOADTHING_VERSION,
    },
  });

  const json = (await res.json()) as
    | { files: { key: string; id: string }[] }
    | { error: string };

  if (!res.ok || "error" in json) {
    const message = "error" in json ? json.error : "Unknown error";
    throw new Error(message);
  }

  return json.files;
};
