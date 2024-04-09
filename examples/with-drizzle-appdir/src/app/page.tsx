import { cache } from "react";

import { db } from "~/server/db";
import * as schema from "~/server/db/schema";
import { Uploader } from "./uploader";

const getFiles = cache(() => db.select().from(schema.files));

export default async function Home() {
  const files = await getFiles();

  return (
    <main>
      <Uploader />
      <h1>Your files</h1>
      <div>
        {files.length === 0 && <i>No files uploaded yet</i>}
        {files.map((file) => (
          <div style={{ display: "flex", gap: 8 }} key={file.id}>
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
