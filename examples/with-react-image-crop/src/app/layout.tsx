import "@uploadthing/react/styles.css";
import "react-image-crop/dist/ReactCrop.css";

import { Inter } from "next/font/google";

import { NextSSRPlugin } from "@uploadthing/react/next-ssr-plugin";
import { shapeRouterConfig } from "uploadthing/server";

import { uploadRouter } from "~/server/uploadthing";

const inter = Inter({ subsets: ["latin"] });

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body className={inter.className}>
        <NextSSRPlugin routerConfig={shapeRouterConfig(uploadRouter)} />
        {children}
      </body>
    </html>
  );
}
