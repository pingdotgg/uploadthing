import { unstable_cache } from "next/cache";

import { db } from "~/server/db";
import * as schema from "~/server/db/schema";
import { Uploader } from "./uploader";

export default async function Home() {
  const files = await unstable_cache(
    () => {
      return db.select().from(schema.files);
    },
    [],
    // We revalidate this tag when an upload completes
    { tags: ["files"] },
  )();

  return (
    <main>
      <Uploader />
      <h1>Your files</h1>
      <div>
        {files.map((file) => (
          <div style={{ display: "flex", gap: 8 }}>
            <div>Name: {file.name}</div>
            <a href={file.url} target="_blank">
              View
            </a>
          </div>
        ))}
      </div>
    </main>
  );
}
