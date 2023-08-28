import type { Json } from "@uploadthing/shared";
import { generateUploadThingURL, UploadThingError } from "@uploadthing/shared";

import { UPLOADTHING_VERSION } from "../constants";
import type { FileEsque, UploadData, UploadError } from "./utils";
import { uploadFilesInternal } from "./utils";

function guardServerOnly() {
  if (typeof window !== "undefined") {
    throw new UploadThingError({
      code: "INTERNAL_SERVER_ERROR",
      message: "The `utapi` can only be used on the server.",
    });
  }
}

function getApiKeyOrThrow() {
  if (!process.env.UPLOADTHING_SECRET) {
    throw new UploadThingError({
      code: "MISSING_ENV",
      message: "Missing `UPLOADTHING_SECRET` env variable.",
    });
  }
  return process.env.UPLOADTHING_SECRET;
}

type UploadFileResponse =
  | { data: UploadData; error: null }
  | { data: null; error: UploadError };

/**
 * @param {FileEsque | FileEsque[]} files The file(s) to upload
 * @param {Json} metadata JSON-parseable metadata to attach to the uploaded file(s)
 *
 * @example
 * await uploadFiles(new File(["foo"], "foo.txt"));
 *
 * @example
 * await uploadFiles([
 *   new File(["foo"], "foo.txt"),
 *   new File(["bar"], "bar.txt"),
 * ]);
 */
export const uploadFiles = async <T extends FileEsque | FileEsque[]>(
  files: T,
  metadata: Json = {},
) => {
  guardServerOnly();

  const filesToUpload: FileEsque[] = Array.isArray(files) ? files : [files];

  const uploads = await uploadFilesInternal(
    {
      files: filesToUpload,
      metadata,
    },
    {
      apiKey: getApiKeyOrThrow(),
      utVersion: UPLOADTHING_VERSION,
    },
  );

  const uploadFileResponse = Array.isArray(files) ? uploads : uploads[0];

  return uploadFileResponse as T extends FileEsque[]
    ? UploadFileResponse[]
    : UploadFileResponse;
};

/**
 * @param {string} url The URL of the file to upload
 * @param {Json} metadata JSON-parseable metadata to attach to the uploaded file(s)
 *
 * @example
 * await uploadFileFromUrl("https://uploadthing.com/f/2e0fdb64-9957-4262-8e45-f372ba903ac8_image.jpg");
 *
 * @example
 * await uploadFileFromUrl([
 *   "https://uploadthing.com/f/2e0fdb64-9957-4262-8e45-f372ba903ac8_image.jpg",
 *   "https://uploadthing.com/f/1649353b-04ea-48a2-9db7-31de7f562c8d_image2.jpg"
 * ])
 */
type Url = string | URL;
export const uploadFilesFromUrl = async <T extends Url | Url[]>(
  urls: T,
  metadata: Json = {},
) => {
  guardServerOnly();

  const fileUrls: Url[] = Array.isArray(urls) ? urls : [urls];

  const formData = new FormData();
  formData.append("metadata", JSON.stringify(metadata));

  const filesToUpload = await Promise.all(
    fileUrls.map(async (url) => {
      if (typeof url === "string") url = new URL(url);
      const filename = url.pathname.split("/").pop() ?? "unknown-filename";

      // Download the file on the user's server to avoid egress charges
      const fileResponse = await fetch(url);
      if (!fileResponse.ok) {
        throw new UploadThingError({
          code: "BAD_REQUEST",
          message: "Failed to download requested file.",
          cause: fileResponse,
        });
      }
      const blob = await fileResponse.blob();
      return Object.assign(blob, { name: filename });
    }),
  );

  const uploads = await uploadFilesInternal(
    {
      files: filesToUpload,
      metadata,
    },
    {
      apiKey: getApiKeyOrThrow(),
      utVersion: UPLOADTHING_VERSION,
    },
  );

  const uploadFileResponse = Array.isArray(urls) ? uploads : uploads[0];

  return uploadFileResponse as T extends Url[]
    ? UploadFileResponse[]
    : UploadFileResponse;
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
    cache: "no-store",
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
    cache: "no-store",
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
    cache: "no-store",
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

/**
 * Rename a file in UploadThing storage.
 *
 * type Rename = {
 *   fileKey: string;
 *   newName: string; // Should include file extension
 * };
 *
 * @param {Rename | Rename[]} updates
 *
 * @example
 * await renameFile({ fileKey: "2e0fdb64-9957-4262-8e45-f372ba903ac8_image.jpg", newName: "new_image.jpg" });
 *
 * @example
 * await renameFile([{ fileKey: "2e0fdb64-9957-4262-8e45-f372ba903ac8_image.jpg", newName: "new_image.jpg" }, { fileKey: "1649353b-04ea-48a2-9db7-31de7f562c8d_image2.jpg", newName: "new_image2.jpg" }]);
 *
 */

type Rename = {
  fileKey: string;
  newName: string;
};

export const renameFile = async (updates: Rename | Rename[]) => {
  guardServerOnly();

  if (!Array.isArray(updates)) updates = [updates];

  const res = await fetch(generateUploadThingURL("/api/renameFile"), {
    method: "POST",
    cache: "no-store",
    headers: {
      "Content-Type": "application/json",
      "x-uploadthing-api-key": getApiKeyOrThrow(),
      "x-uploadthing-version": UPLOADTHING_VERSION,
    },
    body: JSON.stringify({ updates }),
  });

  const json = (await res.json()) as { success: true } | { error: string };

  if (!res.ok || "error" in json) {
    const message = "error" in json ? json.error : "Unknown error";
    throw new Error(message);
  }

  return json;
};
