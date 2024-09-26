import { Inter } from "next/font/google";
import { SignIn, useAuth } from "@clerk/nextjs";

import { UploadButton, UploadDropzone, UT } from "~/utils/uploadthing";

const inter = Inter({ subsets: ["latin"] });

export default function Home() {
  const { isSignedIn } = useAuth();

  return (
    <main className={inter.className}>
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
      {!isSignedIn ? (
        <div
          style={{
            marginTop: "1rem",
            width: "100%",
            display: "flex",
            justifyContent: "center",
          }}
        >
          <SignIn redirectUrl="/" />
        </div>
      ) : (
        <div
          style={{
            marginTop: "1rem",
            width: "100%",
            textAlign: "center",
          }}
        >
          You are signed in!
        </div>
      )}
    </main>
  );
}
