"use server";

import { utapi } from "uploadthing/server";

/**
 * @see https://docs.uploadthing.com/api-reference/server#uploadfiles
 */
export async function uploadFiles(fd: FormData) {
  const files = fd.getAll("files") as File[];
  const uploadedFiles = await utapi.uploadFiles(files);
  return uploadedFiles;
}

/**
 * @see https://docs.uploadthing.com/api-reference/server#uploadfilesfromurl
 */
export async function uploadFromUrl(fd: FormData) {
  const url = fd.get("url") as string;
  const uploadedFile = await utapi.uploadFilesFromUrl(url);
  return uploadedFile.data;
}
