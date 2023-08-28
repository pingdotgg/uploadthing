import {
  UploadButton,
  UploadDropzone,
  useUploadThing,
} from "~/utils/uploadthing";

export default function Home() {
  const { startUpload } = useUploadThing("videoAndImage", {
    onClientUploadComplete: () => {
      alert("Upload Completed");
    },
  });

  return (
    <main>
      <UploadButton
        endpoint="videoAndImage"
        multiple
        onClientUploadComplete={(res) => {
          console.log(`onClientUploadComplete`, res);
          alert("Upload Completed");
        }}
        onUploadBegin={() => {
          console.log("upload begin");
        }}
      />
      <UploadDropzone
        endpoint="videoAndImage"
        multiple
        onClientUploadComplete={(res) => {
          console.log(`onClientUploadComplete`, res);
          alert("Upload Completed");
        }}
        onUploadBegin={() => {
          console.log("upload begin");
        }}
      />
      <input
        type="file"
        onChange={async (e) => {
          const file = e.target.files?.[0];
          if (!file) return;

          // Do something with files

          // Then start the upload
          await startUpload([file]);
        }}
      />
    </main>
  );
}
