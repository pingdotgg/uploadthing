"use client";

import { useState } from "react";

import { useUploadThing } from "~/utils/uploadthing";
import { uploadFiles, uploadFromUrl } from "./_actions";

export default function ServerUploadPage() {
  const [isUploading, setIsUploading] = useState(false);

  const { startUpload } = useUploadThing("videoAndImage", {
    onUploadError: (err) => {
      console.log(err);
    },
  });

  return (
    <div className="mx-auto flex h-screen w-full max-w-sm flex-col items-center justify-center gap-4">
      <h1 className="text-2xl font-bold">Upload using server action</h1>
      <p>
        No file router needed, you validate everything on per-request basis.
      </p>
      <form
        onSubmit={async (e) => {
          e.preventDefault();
          setIsUploading(true);

          const fd = new FormData(e.target as HTMLFormElement);
          const uploadedFiles = await uploadFiles(fd);
          alert(`Uploaded ${uploadedFiles.length} files`);

          setIsUploading(false);
        }}
        className="mb-8 flex w-full flex-col gap-2"
      >
        <input
          name="files"
          type="file"
          multiple
          className="cursor-pointer rounded border p-2 text-sm font-medium file:cursor-pointer file:border-0 file:bg-transparent file:text-sm file:font-semibold"
        />
        <button
          type="submit"
          className="inline-flex items-center justify-center rounded bg-red-500 p-2 font-semibold hover:bg-red-600"
          disabled={isUploading}
        >
          Upload Files
        </button>
      </form>

      <p>
        You can also upload files from URL, but you need to validate the URL
      </p>
      <form
        onSubmit={async (e) => {
          e.preventDefault();

          setIsUploading(true);
          const fd = new FormData(e.target as HTMLFormElement);

          const uploadedFile = await uploadFromUrl(fd);
          if (uploadedFile) {
            setIsUploading(false);
            open(uploadedFile.url, "_blank");
          }
        }}
        className="flex w-full flex-col gap-2"
      >
        <input name="url" className="rounded border p-2 text-sm font-medium" />
        <button
          type="submit"
          className="inline-flex items-center justify-center rounded bg-red-500 p-2 font-semibold hover:bg-red-600"
          disabled={isUploading}
        >
          {isUploading && (
            <span className="h-4 w-4 animate-spin rounded-full border-2 border-r-0" />
          )}
          Upload From URL
        </button>
      </form>
    </div>
  );
}
