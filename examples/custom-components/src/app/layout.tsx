import { Inter } from "next/font/google";

import "./globals.css";

import { Toaster } from "sonner";
import { twMerge } from "tailwind-merge";

import { NextSSRPlugin } from "@uploadthing/react/next-ssr-plugin";
import { extractRouterConfig } from "uploadthing/server";

import { uploadRouter } from "~/uploadthing/server";

const inter = Inter({ subsets: ["latin"], variable: "--font-sans" });

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body className={twMerge("font-sans", inter.variable)}>
        <NextSSRPlugin routerConfig={extractRouterConfig(uploadRouter)} />
        {children}
        <Toaster />
      </body>
    </html>
  );
}
