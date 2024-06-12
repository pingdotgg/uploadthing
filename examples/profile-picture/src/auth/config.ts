import { db } from "@/db/client";
import { User } from "@/db/schema";
import { eq } from "drizzle-orm";
import type { DefaultSession, NextAuthConfig, Session } from "next-auth";

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
    jwt: async ({ token, user, trigger, session }) => {
      if (trigger === "update") {
        // Try to update the user's picture or name from the update request
        token.picture = (session as Session)?.user?.image ?? token.picture;
        token.name = (session as Session)?.user?.name ?? token.name;
      }

      if (user) {
        token.sub = user.id;
        token.name = user.name;
      }

      if (token.sub && !token.picture) {
        // fetch iamge if not set
        const [{ image }] = await db
          .select({ image: User.image, name: User.name })
          .from(User)
          .where(eq(User.id, token.sub));
        token.picture = image;
      }

      return token;
    },
    session: async ({ session, token }) => {
      if (token?.sub) session.user.id = token.sub;
      if (token?.picture) session.user.image = token.picture;
      if (token?.name) session.user.name = token.name;

      return session;
    },
  },
} satisfies NextAuthConfig;
