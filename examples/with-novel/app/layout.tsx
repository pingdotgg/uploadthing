import "./_styles/globals.css";
import "./_styles/prosemirror.css";

import type { ReactNode } from "react";
import type { Metadata, Viewport } from "next";
import { uploadRouter } from "@/uploadthing/server";

import { NextSSRPlugin } from "@uploadthing/react/next-ssr-plugin";
import { extractRouterConfig } from "uploadthing/server";

import Providers from "./providers";

const title =
  "Novel - Notion-style WYSIWYG editor with AI-powered autocompletions";
const description =
  "Novel is a Notion-style WYSIWYG editor with AI-powered autocompletions. Built with Tiptap, OpenAI, and Vercel AI SDK.";

export const metadata: Metadata = {
  title,
  description,
  openGraph: {
    title,
    description,
  },
  twitter: {
    title,
    description,
    card: "summary_large_image",
    creator: "@steventey",
  },
  metadataBase: new URL("https://novel.sh"),
};

export const viewport: Viewport = {
  themeColor: "#ffffff",
};

export default function RootLayout({ children }: { children: ReactNode }) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body>
        <NextSSRPlugin routerConfig={extractRouterConfig(uploadRouter)} />
        <Providers>{children}</Providers>
      </body>
    </html>
  );
}
