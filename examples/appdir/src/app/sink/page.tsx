"use client";

import { useState } from "react";

import { UploadButton, UploadDropzone } from "@uploadthing/react";

import type { OurFileRouter } from "~/server/uploadthing";

export default function Home() {
  const [userInput, setUserInput] = useState<string>("");

  return (
    <main className="flex min-h-screen flex-col items-center justify-center  gap-16 p-24">
      <div>
        <label htmlFor="foo">Send some data along with the files</label>
        <input
          id="foo"
          value={userInput}
          onChange={(e) => setUserInput(e.currentTarget.value)}
        />
      </div>
      <div className="flex flex-col items-center justify-center gap-4">
        <div className="flex gap-4">
          <UploadButton<OurFileRouter>
            endpoint="withInput"
            input={{ foo: userInput }}
            onClientUploadComplete={(res) => {
              console.log("Files: ", res);
              alert("Upload Completed");
            }}
            onUploadError={(error: Error) => {
              alert(`ERROR! ${error.message}`);
            }}
          />

          <UploadButton<OurFileRouter>
            endpoint="videoAndImage"
            onClientUploadComplete={(res) => {
              console.log("Files: ", res);
              alert("Upload Completed");
            }}
            onUploadError={(error: Error) => {
              alert(`ERROR! ${error.message}`);
            }}
          />
        </div>
      </div>
      <div className="flex flex-col items-center justify-center gap-4">
        <span className="text-center text-4xl font-bold">
          {`...or using a dropzone:`}
        </span>
        <UploadDropzone<OurFileRouter>
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
