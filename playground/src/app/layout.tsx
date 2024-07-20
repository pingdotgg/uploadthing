import { Inter } from "next/font/google";

import "./globals.css";

import Link from "next/link";
import { Toaster } from "sonner";
import { twMerge } from "tailwind-merge";

import { NextSSRPlugin } from "@uploadthing/react/next-ssr-plugin";
import { extractRouterConfig } from "uploadthing/server";

import { buttonVariants } from "~/components/ui/button";
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
        <nav className="w-full border-b-2 border-black p-4 text-center">
          <Link href="/gallery" className={buttonVariants({ variant: "link" })}>
            Gallery
          </Link>
          <Link
            href="/rhf-builtin"
            className={buttonVariants({ variant: "link" })}
          >
            RHF Using Built-in components
          </Link>
          <Link
            href="/rhf-custom"
            className={buttonVariants({ variant: "link" })}
          >
            RHF Using a custom dropzone component
          </Link>
        </nav>
        {children}
        <Toaster />
      </body>
    </html>
  );
}
