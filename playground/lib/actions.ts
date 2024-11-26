"use server";

import { revalidateTag } from "next/cache";
import { cookies } from "next/headers";
import { redirect } from "next/navigation";

import { UTApi } from "uploadthing/server";
import { UploadFileResult } from "uploadthing/types";

import { CACHE_TAGS, SESSION_COOKIE_NAME } from "./const";
import { getSession, Session } from "./data";

const utapi = new UTApi();

export async function signIn() {
  /**
   * @note this is just a playground example and provides no real authentication
   */
  const session: Session = {
    sub: 123,
    iat: Date.now(),
    role: "admin",
  };
  const exp = session.iat + 60 * 60 * 1000;
  const cookie = JSON.stringify(session);

  (await cookies()).set(SESSION_COOKIE_NAME, cookie, {
    httpOnly: true,
    sameSite: "lax",
    expires: exp,
  });
}

export async function signOut() {
  (await cookies()).delete(SESSION_COOKIE_NAME);
  redirect("/");
}

export async function uploadFiles(previousState: unknown, form: FormData) {
  const session = await getSession();
  if (!session) {
    return {
      success: false as const,
      error: "Unauthorized",
    };
  }

  const files = form.getAll("files") as File[] | string[];
  let uploadResults: UploadFileResult[];
  if (files.some((file) => typeof file === "string")) {
    uploadResults = await utapi.uploadFilesFromUrl(files as string[]);
  } else {
    uploadResults = await utapi.uploadFiles(files as File[]);
  }

  if (uploadResults.every((result) => result.error !== null)) {
    return {
      success: false as const,
      error: "Failed to upload some files",
    };
  }

  revalidateTag(CACHE_TAGS.LIST_FILES);

  const uploadedCount = uploadResults.filter(
    (result) => result.data != null
  ).length;

  return {
    success: uploadedCount === uploadResults.length,
    uploadedCount,
  };
}

export async function getFileUrl(key: string) {
  const session = await getSession();
  if (!session) {
    return {
      success: false as const,
      error: "Unauthorized",
    };
  }

  const { ufsUrl } = await utapi.generateSignedURL(key);
  return {
    success: true as const,
    url: ufsUrl,
  };
}

export async function deleteFile(key: string) {
  const session = await getSession();
  if (!session) {
    return {
      success: false as const,
      error: "Unauthorized",
    };
  }

  await utapi.deleteFiles(key);
  revalidateTag(CACHE_TAGS.LIST_FILES);

  return {
    success: true as const,
  };
}
