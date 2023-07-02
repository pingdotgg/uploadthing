"use client";

import { useState } from "react";

import { UploadButton, UploadDropzone } from "~/utils/uploadthing";

export default function Home() {
  const [userInput, setUserInput] = useState("");
  const [error, setError] = useState("");

  return (
    <main className="flex min-h-screen flex-col items-center justify-center  gap-16 p-24">
      <div className="flex flex-col">
        <label htmlFor="foo">Send some data along with the files</label>
        <input
          id="foo"
          className="rounded-md border-2 border-gray-400 p-2"
          value={userInput}
          onChange={(e) => setUserInput(e.currentTarget.value)}
        />
        {error && <div className="text-red-500">{error}</div>}
      </div>
      <div className="flex flex-col items-center justify-center gap-4">
        <div className="flex gap-4">
          <UploadButton
            endpoint="withInput"
            input={{ foo: userInput }}
            onClientUploadComplete={(res) => {
              console.log("Files: ", res);
              alert("Upload Completed");
            }}
            onUploadError={(error) => {
              console.log("Error: ", error);
              if (error.data?.zodError?.fieldErrors.foo) {
                setError(error.data?.zodError?.fieldErrors.foo[0]);
              } else {
                setError("");
              }
            }}
          />

          <UploadButton
            endpoint="videoAndImage"
            onClientUploadComplete={(res) => {
              console.log("Files: ", res);
              alert("Upload Completed");
            }}
            onUploadError={(error) => {
              alert(`ERROR! ${error.message}`);
            }}
          />
        </div>
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
