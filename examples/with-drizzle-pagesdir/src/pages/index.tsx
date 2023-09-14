import { Inter } from "next/font/google";
import useSWR from "swr";

import type { File } from "~/server/db/schema";
import { UploadButton, UploadDropzone } from "~/utils/uploadthing";

const inter = Inter({ subsets: ["latin"] });

export default function Page() {
  const { isLoading, data } = useSWR(
    "files",
    () => {
      return fetch("/api/files").then((res) => res.json()) as Promise<{
        files: File[];
      }>;
    },
    { refreshInterval: 300 },
  );

  return (
    <main
      className={inter.className}
      style={{
        display: "flex",
        flexDirection: "column",
        justifyContent: "center",
        alignItems: "center",
      }}
    >
      <UploadButton
        /**
         * @see https://docs.uploadthing.com/api-reference/react#uploadbutton
         */
        endpoint="videoAndImage"
        onClientUploadComplete={async (res) => {
          console.log(`onClientUploadComplete`, res);
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
        }}
        onUploadBegin={() => {
          console.log("upload begin");
        }}
      />
      <h1>Your files</h1>
      <div>
        {isLoading ? (
          <div>Waiting for files</div>
        ) : data?.files.length ? (
          data?.files.map((file) => (
            <div style={{ display: "flex", gap: 8 }}>
              <div>Name: {file.name}</div>
              <a href={file.url} target="_blank">
                View
              </a>
            </div>
          ))
        ) : (
          <i>No files uploaded yet</i>
        )}
      </div>
    </main>
  );
}
