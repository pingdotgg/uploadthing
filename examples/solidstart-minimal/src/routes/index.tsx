import type { VoidComponent } from "solid-js";

import { UploadButton, UploadDropzone } from "~/utils/uploadthing";

const Home: VoidComponent = () => {
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
    </main>
  );
};

export default Home;
