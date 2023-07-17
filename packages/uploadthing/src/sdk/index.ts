import { generateUploadThingURL } from "@uploadthing/shared";

import { UPLOADTHING_VERSION } from "../constants";

function guardServerOnly() {
  if (typeof window !== "undefined") {
    throw new Error("The `utapi` should only be used on the client.");
  }
}

function guardApiKey() {
  if (!process.env.UPLOADTHING_SECRET)
    throw new Error("Missing UPLOADTHING_SECRET env variable.");
  return process.env.UPLOADTHING_SECRET;
}

/**
 * Request to delete files from UploadThing storage.
 * @param {string | string[]} fileKeys
 * @example
 * await deleteFiles("2e0fdb64-9957-4262-8e45-f372ba903ac8_image.jpg");
 * @example
 * await deleteFiles(["2e0fdb64-9957-4262-8e45-f372ba903ac8_image.jpg","1649353b-04ea-48a2-9db7-31de7f562c8d_image2.jpg"])
 */
export const deleteFiles = async (fileKeys: string[] | string) => {
  guardServerOnly();
  const apiKey = guardApiKey();

  if (!Array.isArray(fileKeys)) fileKeys = [fileKeys];

  const res = await fetch(generateUploadThingURL("/api/deleteFile"), {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "x-uploadthing-api-key": apiKey,
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
  guardServerOnly();
  const apiKey = guardApiKey();

  if (!Array.isArray(fileKeys)) fileKeys = [fileKeys];

  const res = await fetch(generateUploadThingURL("/api/getFileUrl"), {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "x-uploadthing-api-key": apiKey,
      "x-uploadthing-version": UPLOADTHING_VERSION,
    },
    body: JSON.stringify({ fileKeys }),
  });
  if (!res.ok) {
    throw new Error("Failed to get file urls");
  }
  return res.json().then(({ data }) => data as { key: string; url: string }[]);
};
