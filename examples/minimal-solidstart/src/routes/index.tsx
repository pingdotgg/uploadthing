import {
  createUploadThing,
  UploadButton,
  UploadDropzone,
} from "~/utils/uploadthing";

export default function Home() {
  const { startUpload } = createUploadThing("videoAndImage", {
    /**
     * @see https://docs.uploadthing.com/api-reference/react#useuploadthing
     */
    onUploadBegin: (fileName) => {
      console.log("onUploadBegin", fileName);
    },
    onClientUploadComplete: (res) => {
      console.log(`onClientUploadComplete`, res);
      alert("Upload Completed");
    },
  });

  return (
    <main class="flex flex-col gap-4 p-8">
      <UploadButton
        /**
         * @see https://docs.uploadthing.com/api-reference/react#uploadbutton
         */
        endpoint="videoAndImage"
        onUploadBegin={(fileName) => {
          console.log("onUploadBegin", fileName);
        }}
        onUploadAborted={() => {
          alert("Upload Aborted");
        }}
        onClientUploadComplete={(res) => {
          console.log(`onClientUploadComplete`, res);
          alert("Upload Completed");
        }}
      />
      <UploadDropzone
        /**
         * @see https://docs.uploadthing.com/api-reference/react#uploaddropzone
         */
        endpoint="videoAndImage"
        onUploadBegin={(fileName) => {
          console.log("onUploadBegin", fileName);
        }}
        onUploadAborted={() => {
          alert("Upload Aborted");
        }}
        onClientUploadComplete={(res) => {
          console.log(`onClientUploadComplete`, res);
          alert("Upload Completed");
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
