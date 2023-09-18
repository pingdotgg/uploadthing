// Example model schema from the Drizzle docs
// https://orm.drizzle.team/docs/sql-schema-declaration
// https://orm.drizzle.team/docs/column-types/sqlite

import { InferSelectModel, sql } from "drizzle-orm";
import { int, sqliteTableCreator, text } from "drizzle-orm/sqlite-core";

export const sqliteTable = sqliteTableCreator((name) => `with-drizzle_${name}`);

export const files = sqliteTable("files", {
  id: int("id").primaryKey({ autoIncrement: true }),
  name: text("name").notNull(),
  key: text("key").notNull(),
  url: text("url").notNull(),
  createdAt: int("created_at", { mode: "timestamp" })
    .notNull()
    .default(sql`CURRENT_TIMESTAMP`),
  uploadedBy: int("uploaded_by").notNull(),
});

export type File = InferSelectModel<typeof files>;
