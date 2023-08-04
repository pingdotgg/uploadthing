'use client';

/* eslint-disable react/react-in-jsx-scope */
/* eslint-disable react/jsx-filename-extension */

import { UploadButton, UploadDropzone } from '~/utils/uploadthing.ts';

export default function Home() {
  return (
    <main className="flex min-h-screen flex-col items-center justify-center  gap-16 p-24">
      <div className="flex flex-col items-center justify-center gap-4">
        <span className="text-center text-4xl font-bold">
          Upload a file using a button:
        </span>

        <UploadButton
          endpoint="withoutMdwr"
          onClientUploadComplete={() => {
            // Do something with the response
          }}
          onUploadError={() => undefined}
        />
      </div>
      <div className="flex flex-col items-center justify-center gap-4">
        <span className="text-center text-4xl font-bold">
          ...or using a dropzone:
        </span>
        <UploadDropzone
          endpoint="withoutMdwr"
          onClientUploadComplete={() => {
            // Do something with the response
          }}
          onUploadError={() => undefined}
        />
      </div>
    </main>
  );
}
