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
        endpoint="videoAndImage"
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
        endpoint="videoAndImage"
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
      <UT.Root endpoint="videoAndImage">
        <UT.Dropzone>
          {({ dropzone, isUploading }) => (
            <>
              <UT.Button>{isUploading ? "Uploading" : "Upload file"}</UT.Button>
              <div>
                <UT.AllowedContent />
              </div>
              {dropzone?.isDragActive && <span>Dragging</span>}
            </>
          )}
        </UT.Dropzone>
      </UT.Root>
    </main>
  );
}
