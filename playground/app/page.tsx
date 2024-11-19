import { Suspense } from "react";

import { FileCard } from "../components/file-card";
import { Uploader } from "../components/uploader";
import { listFiles } from "../lib/data";

export default function Page() {
  return (
    <Suspense>
      <FileList />
    </Suspense>
  );
}

async function FileList() {
  const files = await listFiles();

  return (
    <div className="p-4">
      <div className="flex items-center justify-between">
        <h2 className="text-lg font-medium">Your files:</h2>
        <Uploader />
      </div>
      <ol className="mt-2 grid grid-cols-2 gap-2">
        {files.map((file) => (
          <li key={file.key}>
            <FileCard file={file} />
          </li>
        ))}
      </ol>
    </div>
  );
}
