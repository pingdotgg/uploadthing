import { Inter } from "next/font/google";
import useSWR from "swr";

import { Uploader } from "~/components/uploader";

const inter = Inter({ subsets: ["latin"] });

const fetcher = (...args: any[]) => fetch(...args).then((res) => res.json());

export default function Page() {
  const { isLoading, data } = useSWR("/api/files", fetcher, {
    refreshInterval: 300,
  });

  return (
    <main
      className={inter.className}
      style={{
        display: "flex",
        flexDirection: "column",
        justifyContent: "center",
        alignItems: "center",
      }}
    >
      <Uploader />
      <h1>Your files</h1>
      <div>
        {isLoading ? (
          <div>Waiting for files</div>
        ) : data?.files.length ? (
          data?.files.map((file: any) => (
            <div style={{ display: "flex", gap: 8 }}>
              <div>Name: {file.name}</div>
              <a href={file.url} target="_blank">
                View
              </a>
            </div>
          ))
        ) : (
          <i>No files uploaded yet</i>
        )}
      </div>
    </main>
  );
}
