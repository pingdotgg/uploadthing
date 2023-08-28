"use client";

import { useState } from "react";

import { uploadFiles, uploadFromUrl } from "./_actions";

export default function Home() {
  const [isUploading, setIsUploading] = useState(false);

  return (
    <main style={{ display: "flex", flexDirection: "column", gap: 16 }}>
      <form
        onSubmit={async (e) => {
          e.preventDefault();
          setIsUploading(true);

          const fd = new FormData(e.target as HTMLFormElement);
          const uploadedFiles = await uploadFiles(fd);
          alert(`Uploaded ${uploadedFiles.length} files`);

          setIsUploading(false);
        }}
      >
        <input name="files" type="file" multiple />
        <button type="submit" disabled={isUploading}>
          {isUploading ? "Uploading..." : "Upload Files"}
        </button>
      </form>

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
      >
        <input name="url" />
        <button type="submit" disabled={isUploading}>
          {isUploading ? "Uploading..." : "Upload From URL"}
        </button>
      </form>
    </main>
  );
}
