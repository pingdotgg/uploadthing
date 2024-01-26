import { UploadButton } from "~/utils/uploadthing";

export function ImageUploader() {
  return (
    <UploadButton
      endpoint="videoAndImage"
      onClientUploadComplete={(res) => {
        // Do something with the response
        console.log("Files: ", res);
        alert("Upload Completed");
      }}
      onUploadError={(error: Error) => {
        console.log(error.stack);
        alert(`ERROR! ${error.message}`);
      }}
    />
  );
}
