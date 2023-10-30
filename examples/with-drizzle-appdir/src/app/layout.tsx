import "@uploadthing/react/styles.css";

import { Inter } from "next/font/google";

import { NextSSRPlugin } from "@uploadthing/react/next-ssr-plugin";
import { extractRouterConfig } from "uploadthing/server";

import { uploadRouter } from "~/server/uploadthing";

const inter = Inter({ subsets: ["latin"] });

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body
        className={inter.className}
        style={{ maxWidth: 640, margin: "0 auto", paddingTop: 32 }}
      >
        <NextSSRPlugin routerConfig={extractRouterConfig(uploadRouter)} />
        {children}
      </body>
    </html>
  );
}
