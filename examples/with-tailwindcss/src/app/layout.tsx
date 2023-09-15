import { Inter } from "next/font/google";

import "./globals.css";

import { NextSSRPlugin } from "@uploadthing/react/next-ssr-plugin";
import { shapeRouteConfig } from "uploadthing/server";

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
        <NextSSRPlugin routerConfig={shapeRouteConfig(uploadRouter)} />
        {children}
      </body>
    </html>
  );
}
