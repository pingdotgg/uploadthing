import type { Config } from "drizzle-kit";

export default {
  schema: "./src/db/schema.ts",
  dialect: "sqlite",
  casing: "snake_case",
  dbCredentials: {
    url: process.env.DATABASE_URL!,
  },
} satisfies Config;
