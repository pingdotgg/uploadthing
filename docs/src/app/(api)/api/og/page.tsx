import { blogParams, docsParams } from "./utils";

export default async function Page() {
  return (
    <main className="flex flex-col items-center justify-center gap-4 p-10">
      <div>
        <h2>Landing (todo)</h2>
        <img
          src={`/api/og/docs?${docsParams.toSearchString({
            category: "",
            title: "Better file uploads for developers",
            description: "",
          })}`}
          alt="OpenGraph metadata for the landing"
        />
      </div>

      <div>
        <h2>Docs</h2>
        <img
          src={`/api/og/docs?${docsParams.toSearchString({
            category: "Introduction",
            description:
              "Uploading files is the first step in the process of uploading files to UploadThing. This page explains the general process of uploading files and how you can use the UploadThing API to upload files. There are two ways to upload files to UploadThing",
            title: "Uploading Files",
          })}`}
          alt="OpenGraph metadata for the page"
        />
      </div>

      <div>
        <h2>Blog</h2>
        <img
          src={`/api/og/blog?${blogParams.toSearchString({
            authors: [
              {
                name: "Julius Marminge",
                src: "https://github.com/juliusmarminge.png",
                role: "Software Engineer",
              },
            ],
            title: "Announcing Uploadthing v7",
          })}`}
          alt="OpenGraph metadata for blog posts"
        />
        <img
          src={`/api/og/blog?${blogParams.toSearchString({
            authors: [
              {
                name: "Julius Marminge",
                src: "https://github.com/juliusmarminge.png",
                role: "Software Engineer",
              },
              {
                name: "Mark Florkowski",
                src: "https://github.com/markflorkowski.png",
                role: "CTO @ Ping Labs",
              },
            ],
            title: "Whaddup Blog???",
          })}`}
          alt="OpenGraph metadata for blog posts"
        />
      </div>
    </main>
  );
}
