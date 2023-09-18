import { Database } from "bun:sqlite";
import { drizzle } from "drizzle-orm/bun-sqlite";

import * as schema from "./schema";

const sqlite = new Database(".data/sqlite.db");
export const db = drizzle(sqlite, { schema });
