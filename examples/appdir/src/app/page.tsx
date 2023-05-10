"use client";

import { Inter } from "next/font/google";
import { UploadButton, UploadDropzone } from "@uploadthing/react";
import type { OurFileRouter } from "./_uploadthing";

const inter = Inter({ subsets: ["latin"] });

export default function Home() {
  return (
    <main className="flex min-h-screen flex-col items-center justify-center  gap-16 p-24">
      <div className="flex flex-col items-center justify-center gap-4">
        <span className="text-4xl font-bold text-center">
          {`Upload a file using a button:`}
        </span>
        <UploadButton<OurFileRouter>
          endpoint="withoutMdwr"
          onClientUploadComplete={() => {
            alert("Upload Completed");
          }}
        />
      </div>
      <div className="flex flex-col items-center justify-center gap-4">
        <span className="text-4xl font-bold text-center">
          {`...or using a dropzone:`}
        </span>
        <UploadDropzone<OurFileRouter>
          endpoint="withoutMdwr"
          onClientUploadComplete={() => {
            alert("Upload Completed");
          }}
        />
      </div>
    </main>
  );
}
