import { Inter } from "next/font/google";
import { SignIn, useAuth } from "@clerk/nextjs";
import { UploadButton, UploadDropzone } from "~/utils/uploadthing";

const inter = Inter({ subsets: ["latin"] });

export default function Home() {
  const { isSignedIn } = useAuth();

  return (
    <main
      className={inter.className}
    >
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
