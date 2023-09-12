import { NextResponse } from "next/server";

import { db } from "~/server/db";
import { files as filesTable } from "~/server/db/schema";

export const GET = () => {
  const files = db.select().from(filesTable).all();

  return NextResponse.json({
    files,
  });
};
