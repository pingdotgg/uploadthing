import {
  UploadButton,
  UploadDropzone,
  useUploadThing,
  UT,
} from "~/utils/uploadthing";

export default function Home() {
  const { startUpload } = useUploadThing("videoAndImage", {
    /**
     * @see https://docs.uploadthing.com/api-reference/react#useuploadthing
     */
    onClientUploadComplete: () => {
      alert("Upload Completed");
    },
  });

  return (
    <main>
      <UploadButton
        /**
         * @see https://docs.uploadthing.com/api-reference/react#uploadbutton
         */
        endpoint="videoAndImage"
        onClientUploadComplete={(res) => {
          console.log(`onClientUploadComplete`, res);
          alert("Upload Completed");
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
      <UT.Root
        endpoint="videoAndImage"
        onClientUploadComplete={(res) => {
          console.log(`onClientUploadComplete`, res);
          alert("Upload Completed");
        }}
        onUploadBegin={() => {
          console.log("upload begin");
        }}
      >
        <UT.Dropzone style={{ marginTop: 24 }}>
          {({ dropzone, isUploading }) => (
            <div
              style={{
                borderWidth: 2,
                borderStyle: "dashed",
                borderColor: dropzone?.isDragActive ? "#2563f5" : "#11182725",
                padding: 16,
              }}
            >
              <p
                style={{
                  width: "fit-content",
                }}
              >
                Drag and drop
              </p>
              <UT.Button as="button">
                {isUploading ? "Uploading" : "Upload file"}
              </UT.Button>
              <UT.AllowedContent
                as="p"
                style={{ fontSize: 12, width: "fit-content" }}
              />
            </div>
          )}
        </UT.Dropzone>
      </UT.Root>
    </main>
  );
}
