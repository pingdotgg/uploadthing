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
    jwt: async ({ token, user, session, trigger }) => {
      console.log("jwt", { token, user, session, trigger });
      if (trigger === "update") {
        if ((session as Session)?.user?.image)
          token.picture = (session as Session).user.image;
        if ((session as Session)?.user?.name)
          token.name = (session as Session).user.name;
      }
      if (user) {
        token.sub = user.id;
      }
      return token;
    },
    session: async ({ session, token }) => {
      console.log("session", { session, token });
      if (token?.sub) {
        const image =
          token.picture ??
          (await db
            .select({ image: User.image })
            .from(User)
            .where(eq(User.id, token.sub))
            .then(([user]) => user?.image));

        session.user.id = token.sub;
        session.user.image = image;
      }

      return session;
    },
  },
} satisfies NextAuthConfig;
