import { NextResponse } from "next/server";

import { db } from "~/server/db";
import * as schema from "~/server/db/schema";

export const GET = async () => {
  const files = await db.select().from(schema.files);

  return NextResponse.json({
    files,
  });
};
