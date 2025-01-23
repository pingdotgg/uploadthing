import { Suspense } from "react";
import { connection } from "next/server";
import { Schema } from "effect";

import { NextSSRPlugin } from "@uploadthing/react/next-ssr-plugin";
import { extractRouterConfig } from "uploadthing/server";
import { UploadThingToken } from "uploadthing/types";

import { Button } from "../components/button";
import { Skeleton } from "../components/skeleton";
import { signIn, signOut } from "../lib/actions";
import { getSession } from "../lib/data";
import { uploadRouter } from "./api/uploadthing/route";

import "./global.css";

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body>
        <Suspense>
          <UTSSR />
        </Suspense>
        <Nav />
        {children}
      </body>
    </html>
  );
}

async function UTSSR() {
  await connection();

  return <NextSSRPlugin routerConfig={extractRouterConfig(uploadRouter)} />;
}

function Nav() {
  const token = Schema.decodeUnknownSync(UploadThingToken)(
    process.env.UPLOADTHING_TOKEN,
  );

  return (
    <nav className="flex w-full flex-col justify-between border-b p-4">
      <Suspense
        fallback={
          <div className="flex items-center justify-between">
            <div className="flex gap-2 text-sm/6">
              <Skeleton>{".".repeat(100)}</Skeleton>
            </div>
            <Button className="animate-pulse text-transparent">Sign In</Button>
          </div>
        }
      >
        <SignInOut />
      </Suspense>

      <code className="text-sm/6">
        AppId: {token.appId} Region: {token.regions[0]}
      </code>
    </nav>
  );
}

async function SignInOut() {
  const session = await getSession();

  const Header = () => (
    <div className="flex gap-2 text-sm/6">
      <span className="font-medium">Hello 👋</span>
      <pre>Session: {JSON.stringify(session ?? "null")}</pre>
    </div>
  );

  if (!session) {
    return (
      <div className="flex items-center justify-between">
        <Header />
        <form action={signIn}>
          <Button>Sign In</Button>
        </form>
      </div>
    );
  }

  return (
    <div className="flex items-center justify-between">
      <Header />
      <form action={signOut}>
        <Button>Sign Out</Button>
      </form>
    </div>
  );
}
