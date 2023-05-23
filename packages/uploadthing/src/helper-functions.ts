import {
  UPLOADTHING_VERSION,
  generateUploadThingURL,
} from "./internal/handler";

const UT_SECRET = process.env.UPLOADTHING_SECRET;

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
  return res.json();
};

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
  return res.json();
};
