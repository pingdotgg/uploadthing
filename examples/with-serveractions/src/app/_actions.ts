"use server";

import { UTApi } from "uploadthing/server";

const utapi = new UTApi();

/**
 * @see https://docs.uploadthing.com/api-reference/server#uploadfiles
 */
export async function uploadFiles(fd: FormData) {
  const files = fd.getAll("files") as File[];
  console.log("[ACTION] Uploading files", files);

  const start = Date.now();
  const uploadedFiles = await utapi.uploadFiles(files);
  console.log(
    `[ACTION] Uploaded files in ${Date.now() - start}ms: `,
    uploadedFiles,
  );
  return uploadedFiles;
}

/**
 * @see https://docs.uploadthing.com/api-reference/server#uploadfilesfromurl
 */
export async function uploadFromUrl(fd: FormData) {
  const url = fd.get("url") as string;
  console.log("[ACTION] Uploading file from URL", url);

  const start = Date.now();
  const uploadedFile = await utapi.uploadFilesFromUrl(url);
  console.log(
    `[ACTION] Uploaded file in ${Date.now() - start}ms: `,
    uploadedFile,
  );
  return uploadedFile.data;
}
