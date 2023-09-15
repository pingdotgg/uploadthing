import { Inter } from "next/font/google";

import "./globals.css";

import { NextSSRPlugin } from "@uploadthing/react/next-ssr-plugin";
import { extractRouterConfig } from "uploadthing/server";

import { uploadRouter } from "~/server/uploadthing";

const inter = Inter({ subsets: ["latin"], variable: "--font-sans" });

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body className={["font-sans", inter.variable].join(" ")}>
        <NextSSRPlugin routerConfig={extractRouterConfig(uploadRouter)} />
        {children}
      </body>
    </html>
  );
}
