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
          onClientUploadComplete={(res) => {
            // Do something with the response
            console.log("Files: ", res);
            alert("Upload Completed");
          }}
          onUploadError={(error: Error) => {
            alert(`ERROR! ${error.message}`);
          }}

          // Uncomment this to see custom appearance in action
          // appearance={{
          //   button({ ready, isUploading }) {
          //     return `${ready ? "bg-green-500" : "bg-red-500"} ${isUploading ? "cursor-not-allowed" : ""
          //       } after:bg-orange-400`;
          //   },
          //   container: "p-4 border rounded border-2 border-cyan-300",
          //   allowedContent:
          //     "h-8 flex flex-col items-center justify-center bg-red-100 p-3 rounded",
          // }}

          // Uncomment this to see custom content in action
          // content={{
          //   button({ ready }) {
          //     if (ready) return <div>Upload stuff</div>;

          //     return "Getting ready...";
          //   },
          //   allowedContent({ ready, fileTypes, isUploading }) {
          //     if (!ready) return "Checking what you allow";
          //     if (isUploading) return "Seems stuff is uploading";
          //     return `Stuff you can upload: ${fileTypes.join(", ")}`;
          //   },
          // }}

          className="border rounded p-3 ut-button:bg-red-400 ut-allowed-content:text-lg ut-button:data-ut-readying:bg-orange-300"
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

        // Uncomment this to see custom appearance in action
        // appearance={{
        //   container:
        //     "bg-gray-100 border rounded border-2 border-cyan-300 p-4",
        //   label: "text-orange-400",
        //   allowedContent({ ready }) {
        //     if (ready) return "border p-2 bg-gray-400 rounded text-red-600";

        //     return "";
        //   },
        //   allowedContentContainer: "h-auto",
        //   button: "bg-yellow-400 hover:bg-yellow-500 text-blue-400",
        // }}

        // Uncomment this to see custom content in action
        // content={{
        //   label({ ready }) {
        //     return `${!ready
        //       ? "We are waiting for answer from heaven"
        //       : "Heaven have answered. Start bringing the goods"
        //       }`;
        //   },
        //   allowedContent({ ready }) {
        //     if (ready) return "Depictions of the divine only, please";

        //     return "";
        //   },
        // }}
        />
      </div>
    </main>
  );
}
