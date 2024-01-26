import { generateUploadButton } from "@uploadthing/react";

import type { OurFileRouter } from "~/server/uploadthing";

export const UploadButton = generateUploadButton<OurFileRouter>();

export function ImageUploader() {
  return (
    <UploadButton
      endpoint="videoAndImage"
      onClientUploadComplete={(res) => {
        // Do something with the response
        console.log("Files: ", res);
        alert("Upload Completed");
      }}
      onUploadError={(error: Error) => {
        console.log(error.stack);
        alert(`ERROR! ${error.message}`);
      }}
    />
  );
}
