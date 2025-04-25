"use client";

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
    onBeforeUploadBegin: (files) => {
      console.log("Uploading", files.length, "files");
      return files;
    },
    onUploadBegin: (name) => {
      console.log("Beginning upload of", name);
    },
    onClientUploadComplete: (res) => {
      console.log("Upload Completed.", res.length, "files uploaded");
    },
    onUploadProgress(p) {
      console.log("onUploadProgress", p);
    },
  });

  return (
    <main>
      <UploadButton
        /**
         * @see https://docs.uploadthing.com/api-reference/react#uploadbutton
         */
        endpoint={(routeRegistry) => routeRegistry.videoAndImage}
        onClientUploadComplete={(res) => {
          console.log(`onClientUploadComplete`, res);
          alert("Upload Completed");
        }}
        onUploadBegin={() => {
          console.log("upload begin");
        }}
        config={{ appendOnPaste: true, mode: "manual" }}
      />
      <UploadDropzone
        /**
         * @see https://docs.uploadthing.com/api-reference/react#uploaddropzone
         */
        endpoint={(routeRegistry) => routeRegistry.videoAndImage}
        onUploadAborted={() => {
          alert("Upload Aborted");
        }}
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
        multiple
        onChange={async (e) => {
          const files = Array.from(e.target.files ?? []);

          // Do something with files

          // Then start the upload
          await startUpload(files);
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
          {({ dropzone, state }) => (
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
                {state === "uploading" ? "Uploading" : "Upload file"}
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
