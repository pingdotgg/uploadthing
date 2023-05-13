import { type VoidComponent } from "solid-js";
import type { OurFileRouter } from "./api/uploadthing/core";
import { Uploader } from "@uploadthing/solid";
import "@uploadthing/solid/styles.css";

const Home: VoidComponent = () => {
  return (
    <main class="flex min-h-screen flex-col items-center justify-center gap-16 p-24">
      <Uploader<OurFileRouter>
        endpoint="imageUploader"
        // needed when server side rendering
        url="http://localhost:3000"
        onClientUploadComplete={(res) => {
          console.log(`onClientUploadComplete`, res);
          alert("Upload Completed");
        }}
        buttonMultiple
      />
    </main>
  );
};

export default Home;
