import { createClient } from "@libsql/client";
import { drizzle } from "drizzle-orm/libsql";

import { env } from "~/env.mjs";
import * as schema from "./schema";

const sqlite = createClient({ url: env.DATABASE_URL });
export const db = drizzle(sqlite, { schema });
