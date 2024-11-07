"use client";

import { useRouter } from "next/navigation";

import { generateReactHelpers, generateUploadButton } from "@uploadthing/react";

import { UploadRouter } from "../app/api/uploadthing/route";

export const UTButton = generateUploadButton<UploadRouter>();
export const { useUploadThing } = generateReactHelpers<UploadRouter>();

export function Uploader() {
  const router = useRouter();

  return (
    <UTButton
      endpoint={(rr) => rr.anything}
      input={{}}
      onUploadError={(error) => {
        window.alert(error.message);
      }}
      onClientUploadComplete={() => {
        router.refresh();
      }}
      content={{
        allowedContent: <></>,
        button: ({ isUploading }) => (isUploading ? null : "Upload"),
      }}
      appearance={{
        button: "!text-sm/6",
        allowedContent: "!h-0",
      }}
    />
  );
}
