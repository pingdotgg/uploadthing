import { genId } from "@/utils";
import { relations } from "drizzle-orm";
import {
  integer,
  primaryKey,
  sqliteTable,
  text,
} from "drizzle-orm/sqlite-core";
import type { AdapterAccount } from "next-auth/adapters";

export const User = sqliteTable("user", {
  id: text("id")
    .primaryKey()
    .$defaultFn(() => genId("usr")),
  name: text("name").notNull(),
  email: text("email").notNull(),
  hashedPassword: text("hashedPassword"),
  emailVerified: integer("emailVerified", { mode: "timestamp_ms" }),
  image: text("image"),
});

export const Account = sqliteTable(
  "account",
  {
    userId: text("userId")
      .notNull()
      .references(() => User.id, { onDelete: "cascade" }),
    type: text("type").$type<AdapterAccount["type"]>().notNull(),
    provider: text("provider").notNull(),
    providerAccountId: text("providerAccountId").notNull(),
    refresh_token: text("refresh_token"),
    access_token: text("access_token"),
    expires_at: integer("expires_at"),
    token_type: text("token_type"),
    scope: text("scope"),
    id_token: text("id_token"),
    session_state: text("session_state"),
  },
  (account) => ({
    compoundKey: primaryKey({
      columns: [account.provider, account.providerAccountId],
    }),
  }),
);

export const UserRelations = relations(User, ({ many }) => ({
  accounts: many(Account),
}));

export const AccountRelations = relations(Account, ({ one }) => ({
  user: one(User, { fields: [Account.userId], references: [User.id] }),
}));
