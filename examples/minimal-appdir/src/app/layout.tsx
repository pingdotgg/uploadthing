import "@uploadthing/react/styles.css";

import { Inter } from "next/font/google";

import { uploadRouter } from "~/server/uploadthing";
import { UTHead } from "./utHead";

const inter = Inter({ subsets: ["latin"] });

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body className={inter.className}>
        {children}
        <UTHead router={uploadRouter} />
      </body>
    </html>
  );
}
