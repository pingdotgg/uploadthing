import type { ReactNode } from "react";
import type { Metadata, Viewport } from "next";
import localFont from "next/font/local";
import { RootProvider } from "fumadocs-ui/provider";
import { GeistMono } from "geist/font/mono";
import { GeistSans } from "geist/font/sans";
import { twMerge } from "tailwind-merge";

import "~/app/global.css";

import { siteConfig } from "~/app/source";

const fontCal = localFont({
  src: "./calsans.ttf",
  variable: "--font-cal",
});

export const metadata = {
  metadataBase: new URL("https://timeit.jumr.dev"),
  title: {
    default: siteConfig.name,
    template: `%s - ${siteConfig.name}`,
  },
  description: siteConfig.description,
  icons: {
    icon: "/favicon.ico",
    shortcut: "/favicon-1e6x16.png",
    apple: "/apple-touch-icon.png",
  },
} satisfies Metadata;

export const viewport = {
  themeColor: [
    { media: "(prefers-color-scheme: light)", color: "white" },
    { media: "(prefers-color-scheme: dark)", color: "black" },
  ],
} satisfies Viewport;

export default function Layout({ children }: { children: ReactNode }) {
  return (
    <html lang="en">
      <body
        className={twMerge(
          "min-h-screen font-sans antialiased",
          fontCal.variable,
          GeistSans.variable,
          GeistMono.variable,
        )}
      >
        <RootProvider>{children}</RootProvider>
      </body>
    </html>
  );
}
