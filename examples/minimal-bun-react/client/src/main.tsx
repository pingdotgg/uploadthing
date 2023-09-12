import "@uploadthing/react/styles.css";

import React from "react";
import ReactDOM from "react-dom/client";

import { UploadButton } from "./uploadthing";

function App() {
  return (
    <main
      style={{
        display: "flex",
        flexDirection: "column",
        gap: 16,
        alignItems: "center",
      }}
    >
      <h1>Bun + Vite + Uploadthing</h1>
      <div>
        <UploadButton
          endpoint="videoAndImage"
          onClientUploadComplete={(file) => {
            console.log("uploaded", file);
            alert("Upload complete");
          }}
          onUploadError={(error) => {
            console.error(error, error.cause);
            alert("Upload failed");
          }}
        />
      </div>
    </main>
  );
}

ReactDOM.createRoot(document.getElementById("root")!).render(
  <React.StrictMode>
    <App />
  </React.StrictMode>,
);
