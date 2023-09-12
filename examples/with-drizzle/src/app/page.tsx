"use client";

import { useState } from "react";

import { UploadButton, UploadDropzone } from "~/utils/uploadthing";

export default function Home() {
  const [files, setFiles] = useState([]);

  const fetchFiles = () => {
    fetch("/api/files")
      .then((res) => res.json())
      .then((res) => setFiles(res.files));
  };

  return (
    <main>
      <UploadButton
        /**
         * @see https://docs.uploadthing.com/api-reference/react#uploadbutton
         */
        endpoint="videoAndImage"
        onClientUploadComplete={(res) => {
          console.log(`onClientUploadComplete`, res);
          alert("Upload Completed");

          setTimeout(() => fetchFiles(), 300);
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
        }}
        onUploadBegin={() => {
          console.log("upload begin");
        }}
      />
      <div>
        {files.map(({ name }) => (
          <div
            style={{
              display: "flex",
            }}
          >
            <div>Name:</div>
            <div
              style={{
                marginLeft: "1rem",
              }}
            >
              {name}
            </div>
          </div>
        ))}
      </div>
    </main>
  );
}
