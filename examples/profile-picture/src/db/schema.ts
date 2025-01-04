import { relations } from "drizzle-orm";
import {
  integer,
  primaryKey,
  sqliteTable,
  text,
} from "drizzle-orm/sqlite-core";
import type { AdapterAccount } from "next-auth/adapters";

export const User = sqliteTable("user", {
  id: text()
    .primaryKey()
    .$defaultFn(() => `usr_` + crypto.randomUUID().replace(/-/g, "")),
  name: text().notNull(),
  email: text().notNull(),
  hashedPassword: text(),
  emailVerified: integer({ mode: "timestamp_ms" }),
  image: text(),
});

export const Account = sqliteTable(
  "account",
  {
    userId: text()
      .notNull()
      .references(() => User.id, { onDelete: "cascade" }),
    type: text().$type<AdapterAccount["type"]>().notNull(),
    provider: text().notNull(),
    providerAccountId: text().notNull(),
    refresh_token: text(),
    access_token: text(),
    expires_at: integer(),
    token_type: text(),
    scope: text(),
    id_token: text(),
    session_state: text(),
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
