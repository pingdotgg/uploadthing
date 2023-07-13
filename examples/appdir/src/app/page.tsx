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
        // Uncomment to see custom render in action
        // render={({
        //   getInputProps,
        //   ready,
        //   isUploading,
        //   getUploadButtonText,
        //   getAllowedContentText
        // }) => (
        //   <div
        //     className="flex flex-col items-center justify-center gap-4"
        //   >
        //     <label
        //       className={`relative flex h-10 w-36 cursor-pointer items-center justify-center overflow-hidden rounded-md text-white after:transition-[width] after:duration-500 ${!ready && "cursor-not-allowed bg-blue-400"} ${ready &&
        //         isUploading &&
        //         `bg-blue-400 after:absolute after:left-0 after:h-full after:bg-blue-600`} ${ready && !isUploading && "bg-orange-600"
        //         }`}
        //     >
        //       <input
        //         {...getInputProps()}
        //       />
        //       {isUploading
        //         ? "Uploading..." :
        //         getUploadButtonText()}
        //     </label>
        //     <div
        //       className="text-center text-sm font-bold"
        //     >
        //       {getAllowedContentText()}
        //     </div>
        //   </div>
        // )}

        // Uncomment this to see custom appearance in action
        // appearance={{
        //   button({ ready, isUploading }) {
        //     return `${ready ? "bg-green-500" : "bg-red-500"} ${isUploading ? "cursor-not-allowed" : ""
        //       } after:bg-orange-400`;
        //   },
        //   container: "p-4 border rounded border-2 border-cyan-300",
        //   allowedContentContainer:
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
        // Uncomment to see custom render in action
        // render={({
        //   getInputProps,
        //   getRootProps,
        //   getLabelText,
        //   getAllowedContentText,
        //   getUploadButtonProps,
        //   getUploadButtonText,
        //   files
        // }) => (
        //   <div
        //     {...getRootProps()}
        //     className="flex flex-col items-center justify-center gap-4"
        //   >
        //     <label
        //       htmlFor="file-upload"
        //       className="w-64 text-center cursor-pointer"
        //     >
        //       {getLabelText()}
        //       <input {...getInputProps()} />
        //     </label>
        //     <div>
        //       {getAllowedContentText()}
        //     </div>
        //     {
        //       files.length > 0 && (
        //         <button
        //           {...getUploadButtonProps()}
        //           className="py-3 px-2 bg-blue-400 rounded text-gray-50"
        //         >
        //           {getUploadButtonText()}
        //         </button>
        //       )
        //     }
        //   </div>
        // )}

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
