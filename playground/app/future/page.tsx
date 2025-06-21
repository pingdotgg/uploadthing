"use client";

import { useRef, useState, useTransition } from "react";

import { AnyFile } from "uploadthing/client-future";

import { future_createUpload, future_uploadFiles } from "../../lib/uploadthing";
import { UploadRouter } from "../api/uploadthing/route";

function AsyncUploader() {
  const [files, setFiles] = useState<AnyFile<UploadRouter["anyPrivate"]>[]>([]);

  const acRef = useRef(new AbortController());

  return (
    <div className="mx-auto max-w-2xl p-8">
      <form
        className="flex flex-col gap-4"
        action={async (formData) => {
          const files = formData.getAll("files") as File[];
          console.log("SUBMITTED", files);

          const result = await future_uploadFiles("anyPrivate", {
            files,
            signal: acRef.current.signal,
            onEvent: (event) => {
              console.log("EVENT", event);
              setFiles([...event.files]);
            },
            input: {},
          });

          console.log("COMPLETE", result);
        }}
      >
        <input
          type="file"
          name="files"
          multiple
          className="block w-full rounded border p-2 text-sm"
        />
        <button
          type="submit"
          className="inline-flex rounded bg-red-500 px-4 py-2 text-black transition-colors hover:bg-red-600"
        >
          Upload
        </button>
      </form>

      <div>
        {files.map((file, i) => (
          <div key={file.key ?? i}>
            <pre className="text-xs font-medium">
              {JSON.stringify(file, null, 2)}
            </pre>
            <button onClick={() => acRef.current.abort()}>Abort</button>
          </div>
        ))}
      </div>
    </div>
  );
}

function ControlledUploader() {
  const [files, setFiles] = useState<AnyFile<UploadRouter["anyPrivate"]>[]>([]);
  const [selectedFiles, setSelectedFiles] = useState<File[]>([]);
  const [uploadControls, setUploadControls] = useState<Awaited<
    ReturnType<typeof future_createUpload>
  > | null>(null);
  const [isUploading, setIsUploading] = useState(false);
  const [isPending, startTransition] = useTransition();

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      setSelectedFiles(Array.from(e.target.files));
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (selectedFiles.length === 0) return;

    startTransition(async () => {
      setIsUploading(true);

      // Create uploads for each file
      const controls = await future_createUpload("anyPrivate", {
        files: selectedFiles,
        onEvent: (event) => {
          console.log("EVENT", event);
          setFiles([...event.files]);
        },
        input: {},
      });

      setUploadControls(controls);
    });
  };

  const handleComplete = () => {
    if (uploadControls?.done) {
      startTransition(async () => {
        const result = await uploadControls.done();
        console.log("COMPLETE", result);
        setIsUploading(false);
        setSelectedFiles([]);
        setFiles([]);
        setUploadControls(null);
        alert("Upload complete!");
      });
    }
  };

  return (
    <div className="mx-auto max-w-2xl p-8">
      <form className="flex flex-col gap-4" onSubmit={handleSubmit}>
        <input
          type="file"
          multiple
          className="block w-full rounded border p-2 text-sm"
          onChange={handleFileChange}
          disabled={isUploading}
        />
        <div className="flex gap-2">
          <button
            type="submit"
            className="inline-flex rounded bg-red-500 px-4 py-2 text-black transition-colors hover:bg-red-600 disabled:opacity-50"
            disabled={selectedFiles.length === 0 || isUploading}
          >
            Start Upload
          </button>
          {isUploading && uploadControls && (
            <button
              type="button"
              className="inline-flex rounded bg-green-500 px-4 py-2 text-black transition-colors hover:bg-green-600 disabled:opacity-50"
              onClick={handleComplete}
              disabled={isPending}
            >
              Complete Upload
            </button>
          )}
        </div>
      </form>

      {files.length > 0 && (
        <div className="mt-6 space-y-4">
          <h3 className="text-lg font-medium">Files</h3>
          {files.map((file, index) => (
            <div key={index} className="rounded border p-4">
              <div className="flex items-center justify-between">
                <span className="truncate font-medium">{file.name}</span>
                <div className="flex gap-2">
                  <button
                    className="rounded bg-yellow-500 px-2 py-1 text-xs text-black"
                    onClick={() => uploadControls?.pauseUpload(file)}
                    disabled={!uploadControls}
                  >
                    Pause
                  </button>
                  <button
                    className="rounded bg-blue-500 px-2 py-1 text-xs text-black"
                    onClick={() => uploadControls?.resumeUpload(file)}
                    disabled={!uploadControls}
                  >
                    Resume
                  </button>
                </div>
              </div>
              <div className="mt-2">
                <div className="h-2 w-full rounded-full bg-gray-200">
                  <div
                    className="h-2 rounded-full bg-red-500"
                    style={{ width: `${(file.sent / file.size) * 100}%` }}
                  ></div>
                </div>
                <div className="mt-1 text-right text-xs">
                  {Math.round((file.sent / file.size) * 100)}%
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      <pre className="mt-6 text-xs font-medium">
        Files: {JSON.stringify(files, null, 2)}
      </pre>
    </div>
  );
}

export default function FuturePage() {
  const [mode, setMode] = useState<"async" | "controlled">("async");

  return (
    <div className="mx-auto max-w-2xl p-8">
      <h1 className="mb-4 text-3xl font-bold">Future</h1>
      <p className="mb-8 text-gray-600">
        A place to test stuff not yet on stable channel
      </p>

      <div className="mb-6 flex gap-4">
        <button
          onClick={() => setMode("async")}
          className={`rounded-md px-4 py-2 transition-colors ${
            mode === "async"
              ? "bg-red-500 text-white"
              : "bg-gray-200 hover:bg-gray-300"
          }`}
        >
          Async
        </button>
        <button
          onClick={() => setMode("controlled")}
          className={`rounded-md px-4 py-2 transition-colors ${
            mode === "controlled"
              ? "bg-red-500 text-white"
              : "bg-gray-200 hover:bg-gray-300"
          }`}
        >
          Controlled
        </button>
      </div>

      {mode === "async" ? <AsyncUploader /> : <ControlledUploader />}
    </div>
  );
}
