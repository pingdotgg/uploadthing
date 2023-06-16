"use client";

import { useState } from "react";

import { UploadButton, UploadDropzone } from "~/utils/uploadthing";

export default function Home() {
  const [foo, setFoo] = useState("Bar123");
  return (
    <main className="flex min-h-screen flex-col items-center justify-center  gap-16 p-24">
      <input
        placeholder="Foo (Min 5 chars)"
        type="text"
        value={foo}
        className="rounded-md border-2 border-gray-400 p-2"
        onChange={(e) => setFoo(e.target.value)}
      />
      <div className="flex flex-col items-center justify-center gap-4">
        <span className="text-center text-4xl font-bold">
          {`Upload a file using a button:`}
        </span>

        <UploadButton
          endpoint="withInput"
          onClientUploadComplete={(res) => {
            // Do something with the response
            console.log("Files: ", res);
            alert("Upload Completed");
          }}
          onUploadError={(error: Error) => {
            alert(`ERROR! ${error.message}`);
          }}
          input={{
            foo,
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
