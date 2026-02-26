import { cookies } from "next/headers";

import { UTApi } from "uploadthing/server";

import { SESSION_COOKIE_NAME } from "./const";

const utapi = new UTApi();

export async function listFiles() {
  const { files } = await utapi.listFiles();

  return files;
}

export type ListedFileInfo = Awaited<ReturnType<typeof listFiles>>[number];

export interface Session {
  sub: number;
  iat: number;
  role: string;
}

export async function getSession(): Promise<Session | null> {
  const cook = (await cookies()).get(SESSION_COOKIE_NAME);
  if (!cook?.value) return null;
  return JSON.parse(cook.value) as Session;
}
