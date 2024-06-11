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
      // fetch the profile image whenever our profile-pic-uploader called `useSession().update`
      if (trigger === "update") {
        const { image, name } = await db
            .select({ image: User.image })
            .from(User)
            .where(eq(User.id, token.sub))
            .then(([user]) => ({ image: user?.image, name: user?.name }));
          token.picture = image;
          }
          if (user) {
            token.sub = user.id;
            token.name = user.name;
      }
      return token;
    },
    session: async ({ session, token }) => {
      if (token?.sub) {
        session.user.id = token.sub;
      }
      if (token?.picture) {
        session.user.image = token.picture
      }
      if (token?.name) {
        session.user.image = token.picture
      }

      return session;
    },
  },
} satisfies NextAuthConfig;
