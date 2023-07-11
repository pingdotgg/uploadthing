import { utapi } from "uploadthing/server";

async function uploadFile(fd: FormData) {
  "use server";
  const file = fd.get("file") as File;
  const res = await utapi.uploadFiles([file]);
  console.log("[APP] res", res);
}

export default function ServerUploadPage() {
  return (
    <div>
      <h1>Upload from server!!!</h1>
      <form action={uploadFile}>
        <input name="file" type="file" />
        <button type="submit">Submit!!!</button>
      </form>
    </div>
  );
}
