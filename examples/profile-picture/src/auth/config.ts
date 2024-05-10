import { db } from "@/db/client";
import { User } from "@/db/schema";
import { eq } from "drizzle-orm";
import type { DefaultSession, NextAuthConfig } from "next-auth";

declare module "next-auth" {
  interface Session {
    user: DefaultSession["user"] & {
      id: string;
    };
  }
}

export const authConfig = {
  session: { strategy: "jwt" },
  providers: [],
  pages: { signIn: "/" },
  callbacks: {
    session: async ({ session, token }) => {
      if (token?.sub) {
        const [user] = await db
          .select({ image: User.image })
          .from(User)
          .where(eq(User.id, token.sub));

        session.user.id = token.sub;
        session.user.image = user?.image;
      }
      return session;
    },
  },
} satisfies NextAuthConfig;
