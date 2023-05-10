import { Inter } from "next/font/google";
import { UploadButton } from "@uploadthing/react";

import type { OurFileRouter } from "~/server/uploadthing/router";

const inter = Inter({ subsets: ["latin"] });

export default function Home() {
  return (
    <main
      className={`flex min-h-screen flex-col items-center justify-between p-24 ${inter.className}`}
    >
      <UploadButton<OurFileRouter>
        endpoint="withoutMdwr"
        onClientUploadComplete={() => {
          alert("Upload Completed");
        }}
      />
    </main>
  );
}
