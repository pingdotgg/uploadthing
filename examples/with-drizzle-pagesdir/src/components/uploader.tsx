import { UploadButton, UploadDropzone } from "~/utils/uploadthing";

export function Uploader() {
  return (
    <>
      <UploadButton
        /**
         * @see https://docs.uploadthing.com/api-reference/react#uploadbutton
         */
        endpoint="videoAndImage"
        onClientUploadComplete={async (res) => {
          console.log(`onClientUploadComplete`, res);
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
        }}
        onUploadBegin={() => {
          console.log("upload begin");
        }}
      />
    </>
  );
}
