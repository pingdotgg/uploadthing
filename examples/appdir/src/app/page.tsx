"use client";

import { UploadButton, UploadDropzone } from "~/utils/uploadthing";

export default function Home() {
  return (
    <main className="flex min-h-screen flex-col items-center justify-center  gap-16 p-24">
      <div className="flex flex-col items-center justify-center gap-4">
        <span className="text-center text-4xl font-bold">
          {`Upload a file using a button:`}
        </span>

        <UploadButton
          endpoint="withoutMdwr"
          appearance={{
            elements: {
              button({
                ready,
                isUploading
              }) {
                return `${ready ? "bg-green-500" : "bg-red-500"} ${isUploading ? "cursor-not-allowed" : ''} after:bg-orange-400`
              },
              container: "p-4 border rounded border-2 border-cyan-300",
              allowedContentContainer: 'h-8 flex flex-col items-center justify-center bg-red-100 p-3 rounded',
            },
            content: {
              button({
                ready
              }) {
                if (ready) return <div>Upload stuff</div>;

                return "Getting ready...";
              },
              allowedContent({
                ready,
                fileTypes,
                isUploading
              }) {
                if (!ready) return "Checking what you allow";
                if (isUploading) return "Seems stuff is uploading";
                return `Stuff you can upload: ${fileTypes.join(", ")}`;
              },
            }
          }}
        />
      </div>
      <div className="flex flex-col items-center justify-center gap-4">
        <span className="text-center text-4xl font-bold">
          {`...or using a dropzone:`}
        </span>
        <UploadDropzone
          endpoint="withoutMdwr"
          onClientUploadComplete={(res) => {
            // Do something with the response
            console.log("Files: ", res);
            alert("Upload Completed");
          }}
          onUploadError={(error: Error) => {
            alert(`ERROR! ${error.message}`);
          }}
        />
      </div>
    </main>
  );
}
