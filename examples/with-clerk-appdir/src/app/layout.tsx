import "@uploadthing/react/styles.css";

import { Inter } from "next/font/google";
import { ClerkProvider } from "@clerk/nextjs";

import { NextSSRPlugin } from "@uploadthing/react/next-ssr-plugin";
import { extractRouterConfig } from "uploadthing/server";

import { uploadRouter } from "~/server/uploadthing";

const inter = Inter({ subsets: ["latin"] });

export const metadata = {
  title: "Next.js 13 with Clerk",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <ClerkProvider>
      <html lang="en">
        <body className={inter.className}>
          <NextSSRPlugin routerConfig={extractRouterConfig(uploadRouter)} />
          {children}
        </body>
      </html>
    </ClerkProvider>
  );
}
