import { utapi } from "uploadthing/server";

async function uploadFile(fd: FormData) {
  "use server";
  const files = fd.getAll("files") as File[];
  console.log("Uploading file", files);
  const res = await utapi.uploadFiles(files);
  console.log("Upload complete", res);
}

export default function ServerUploadPage() {
  return (
    <div className="mx-auto flex h-screen w-full max-w-sm flex-col items-center justify-center gap-4">
      <h1 className="text-2xl font-bold">Upload using server action</h1>
      <p>
        No file router needed, you validate everything on per-request basis.
      </p>
      <form action={uploadFile} className="flex w-full flex-col gap-2">
        <input
          name="files"
          type="file"
          multiple
          className="cursor-pointer rounded border p-2 text-sm font-medium file:cursor-pointer file:border-0 file:bg-transparent file:text-sm file:font-semibold"
        />
        <button
          type="submit"
          className="inline-flex items-center justify-center rounded bg-red-500 p-2 font-semibold hover:bg-red-600"
        >
          Upload Files
        </button>
      </form>
    </div>
  );
}
