/* eslint-disable react/jsx-filename-extension */
/* eslint-disable react/react-in-jsx-scope */
import { Inter } from 'next/font/google';

import { UploadButton, UploadDropzone } from '~/utils/uploadthing.ts';

const inter = Inter({ subsets: ['latin'] });

export default function Home() {
  return (
    <main
      className={`flex min-h-screen flex-col items-center justify-center gap-16 p-24 ${inter.className}`}
    >
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
