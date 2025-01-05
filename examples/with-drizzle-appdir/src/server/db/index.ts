import { createClient } from "@libsql/client";
import { drizzle } from "drizzle-orm/libsql";

import { env } from "~/env.mjs";
import * as schema from "./schema";

export const db = drizzle({
  client: createClient({ url: env.DATABASE_URL }),
  casing: "snake_case",
  schema,
});
