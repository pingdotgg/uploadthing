"use client";

import { useRouter } from "next/navigation";

import { File } from "~/server/db/schema";
import { UploadButton, UploadDropzone } from "~/utils/uploadthing";

/**
 * Polling is required if we want to be sure the serverside
 * `onUploadComplete` handler has finished processing the file.
 *
 * This is useful if you want the client to have additional information
 * regarding the file than just the metadata returned from UploadThing.
 */
async function pollForServerComplete(fileKey: string): Promise<File> {
  const res = await fetch(`/api/file/${fileKey}`);
  if (res.status === 200) {
    // file exists in our db => server has completed processing
    return await res.json();
  }
  // Simple polling, you can do exponential backoff or whatever technique you want
  await new Promise((resolve) => setTimeout(resolve, 1000));
  return await pollForServerComplete(fileKey);
}

export function Uploader() {
  const router = useRouter();
  return (
    <>
      <UploadButton
        /**
         * @see https://docs.uploadthing.com/api-reference/react#uploadbutton
         */
        endpoint="videoAndImage"
        onClientUploadComplete={async (res) => {
          console.log(`onClientUploadComplete`, res);
          const [fileRes] = res ?? [];
          if (!fileRes) return;

          const file = await pollForServerComplete(fileRes.key);
          console.log(`Full file from our db:`, file);
          router.refresh();
        }}
        onUploadBegin={() => {
          console.log("upload begin");
        }}
      />
      <UploadDropzone
        /**
         * @see https://docs.uploadthing.com/api-reference/react#uploaddropzone
         */
        endpoint="videoAndImage"
        onClientUploadComplete={(res) => {
          console.log(`onClientUploadComplete`, res);
          alert("Upload Completed");
          setTimeout(router.refresh, 500);
        }}
        onUploadBegin={() => {
          console.log("upload begin");
        }}
      />
    </>
  );
}
