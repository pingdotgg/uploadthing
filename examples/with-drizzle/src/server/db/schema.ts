// Example model schema from the Drizzle docs
// https://orm.drizzle.team/docs/sql-schema-declaration

import { int, sqliteTableCreator, text } from "drizzle-orm/sqlite-core";

export const sqliteTable = sqliteTableCreator((name) => `with-drizzle_${name}`);

export const files = sqliteTable("files", {
  id: int("id").primaryKey(),
  name: text("name"),
});
