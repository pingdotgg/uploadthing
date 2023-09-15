import { type Config } from "drizzle-kit";

export default {
  schema: "./src/server/db/schema.ts",
  driver: "better-sqlite",
  dbCredentials: {
    url: "./.data/sqlite.db",
  },
  tablesFilter: ["with-drizzle_*"],
} satisfies Config;
