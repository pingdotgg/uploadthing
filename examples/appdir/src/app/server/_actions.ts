"use server";

import { utapi } from "uploadthing/server";

export async function uploadFiles(fd: FormData) {
  const files = fd.getAll("files") as File[];
  const uploadedFiles = await utapi.uploadFiles(files);
  return uploadedFiles;
}

export async function uploadFromUrl(fd: FormData) {
  const url = fd.get("url") as string;
  const uploadedFile = await utapi.uploadFilesFromUrl(url);
  return uploadedFile;
}
