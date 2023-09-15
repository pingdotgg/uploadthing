import { NextRequest, NextResponse } from "next/server";
import { eq } from "drizzle-orm";

import { db } from "~/server/db";
import * as schema from "~/server/db/schema";

/**
 * This route can be used for polling whether a file has been uploaded yet.
 * It will return a cached response until this route is revalidated by the
 * upload route (see `uploadRouter` in `server/uploadthing.ts`).
 */
export const revalidate = false;

export async function GET(
  _req: NextRequest,
  props: { params: { key: string } },
) {
  const key = props.params.key;
  if (!key) {
    return NextResponse.json({ error: "No key" }, { status: 400 });
  }

  const file = await db
    .select()
    .from(schema.files)
    .where(eq(schema.files.key, key))
    .limit(1)
    .then((x) => x[0] ?? null);

  if (!file) {
    return NextResponse.json({ error: "File not found" }, { status: 404 });
  }

  return NextResponse.json(file);
}
