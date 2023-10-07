"use client";

import { useState } from "react";
import { SubmitHandler, useForm } from "react-hook-form";

import { useDropzone } from "@uploadthing/react/hooks";

import { useUploadThing } from "~/utils/uploadthing";

type Inputs = {
  message: string;
};

export default function Home() {
  const [files, setFiles] = useState<File[]>([]);
  const { startUpload } = useUploadThing("videoAndImage");
  const { handleSubmit, register, reset } = useForm<Inputs>();
  const { getInputProps, getRootProps } = useDropzone({
    onDrop: (files) => {
      setFiles(files);
    },
  });

  const onSubmit: SubmitHandler<Inputs> = async (data) => {
    if (!files) return;

    const res = await startUpload(files);

    if (!res) {
      alert("Upload failed");
      return;
    }

    alert(`You uploaded ${res[0]?.name} with a message of ${data.message}`);

    setFiles([]);
    reset();
  };

  return (
    <main className="mx-auto flex min-h-screen max-w-sm flex-col items-center justify-center gap-4 py-24">
      <form
        onSubmit={handleSubmit(onSubmit)}
        className="flex flex-col items-center justify-center"
      >
        <label
          htmlFor="message"
          className="mb-2 block text-sm font-medium text-gray-900"
        >
          Message
        </label>
        <input
          id="message"
          {...register("message")}
          className="block w-full rounded-lg border border-gray-300 bg-gray-50 p-2.5 text-sm text-gray-900 focus:border-blue-500 focus:ring-blue-500"
        />
        <div
          {...getRootProps()}
          className="mt-2 flex w-full flex-col items-center justify-center rounded-lg border border-dashed border-gray-900/25 px-6 py-10 text-center"
        >
          {files.length > 0 ? <div>{files[0]?.name}</div> : null}
          <input className="sr-only" {...getInputProps()} />
        </div>
        <button
          type="submit"
          className="mt-4 rounded border px-2 py-1 transition-colors hover:bg-gray-100"
        >
          Submit
        </button>
      </form>
    </main>
  );
}
