import type { VoidComponent } from "solid-js";

import { Uploader } from "@uploadthing/solid";

import "@uploadthing/solid/styles.css";

import type { OurFileRouter } from "~/server/uploadthing";

const Home: VoidComponent = () => {
  return (
    <main class="flex min-h-screen flex-col items-center justify-center gap-16 p-24">
      <Uploader<OurFileRouter>
        endpoint="withoutMdwr"
        // needed when server side rendering
        url="http://localhost:9898"
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
