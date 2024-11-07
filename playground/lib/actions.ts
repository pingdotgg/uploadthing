"use server";

import { revalidateTag } from "next/cache";
import { cookies } from "next/headers";
import { redirect } from "next/navigation";

import { UTApi } from "uploadthing/server";

import { CACHE_TAGS, SESSION_COOKIE_NAME } from "./const";
import { getSession, Session } from "./data";

const utapi = new UTApi();

export async function signIn() {
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

export async function getFileUrl(key: string) {
  const session = await getSession();
  if (!session) {
    return {
      success: false as const,
      error: "Unauthorized",
    };
  }

  const { url } = await utapi.getSignedURL(key);
  return {
    success: true as const,
    url,
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
