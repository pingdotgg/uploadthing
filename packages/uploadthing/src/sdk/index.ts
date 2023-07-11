import type { Json } from "@uploadthing/shared";
import { generateUploadThingURL } from "@uploadthing/shared";

import { UPLOADTHING_VERSION } from "../constants";

const UT_SECRET = process.env.UPLOADTHING_SECRET;

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
  if (!Array.isArray(files)) files = [files];
  if (!UT_SECRET) throw new Error("Missing UPLOADTHING_SECRET env variable.");

  const formData = new FormData();
  files.forEach((file) => formData.append("files", file));
  formData.append("metadata", JSON.stringify(metadata));

  const res = await fetch(generateUploadThingURL("/api/uploadFiles"), {
    method: "POST",
    headers: {
      "x-uploadthing-api-key": UT_SECRET,
      "x-uploadthing-version": UPLOADTHING_VERSION,
    },
    body: formData,
  });
  const json = (await res.json()) as
    | { data: { key: string; url: string }[] }
    | { error: string };

  if (!res.ok || "error" in json) {
    console.log("Error", "error" in json ? json.error : "Unknown error");
    // TODO: Return something more useful
    throw new Error("Failed to upload files");
  }
  return json.data;
};

/**
 * Request to delete files from UploadThing storage.
 * @param {string | string[]} fileKeys
 * @example
 * await deleteFiles("2e0fdb64-9957-4262-8e45-f372ba903ac8_image.jpg");
 * @example
 * await deleteFiles(["2e0fdb64-9957-4262-8e45-f372ba903ac8_image.jpg","1649353b-04ea-48a2-9db7-31de7f562c8d_image2.jpg"])
 */
export const deleteFiles = async (fileKeys: string[] | string) => {
  if (!Array.isArray(fileKeys)) fileKeys = [fileKeys];
  if (!UT_SECRET) throw new Error("Missing UPLOADTHING_SECRET env variable.");

  const res = await fetch(generateUploadThingURL("/api/deleteFile"), {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "x-uploadthing-api-key": UT_SECRET,
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
 * @example
 * const data = await getFileUrls("2e0fdb64-9957-4262-8e45-f372ba903ac8_image.jpg");
 * console.log(data); // [{key: "2e0fdb64-9957-4262-8e45-f372ba903ac8_image.jpg", url: "https://uploadthing.com/f/2e0fdb64-9957-4262-8e45-f372ba903ac8_image.jpg"}]
 *
 * @example
 * const data = await getFileUrls(["2e0fdb64-9957-4262-8e45-f372ba903ac8_image.jpg","1649353b-04ea-48a2-9db7-31de7f562c8d_image2.jpg"])
 * console.log(data) // [{key: "2e0fdb64-9957-4262-8e45-f372ba903ac8_image.jpg", url: "https://uploadthing.com/f/2e0fdb64-9957-4262-8e45-f372ba903ac8_image.jpg" },{key: "1649353b-04ea-48a2-9db7-31de7f562c8d_image2.jpg", url: "https://uploadthing.com/f/1649353b-04ea-48a2-9db7-31de7f562c8d_image2.jpg"}]
 */
export const getFileUrls = async (fileKeys: string[] | string) => {
  if (!Array.isArray(fileKeys)) fileKeys = [fileKeys];
  if (!UT_SECRET) throw new Error("Missing UPLOADTHING_SECRET env variable.");

  const res = await fetch(generateUploadThingURL("/api/getFileUrl"), {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "x-uploadthing-api-key": UT_SECRET,
      "x-uploadthing-version": UPLOADTHING_VERSION,
    },
    body: JSON.stringify({ fileKeys }),
  });
  if (!res.ok) {
    throw new Error("Failed to get file urls");
  }
  return res.json().then(({ data }) => data as { key: string; url: string }[]);
};
