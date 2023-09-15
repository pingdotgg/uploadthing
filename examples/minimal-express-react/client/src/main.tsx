import React from "react";
import ReactDOM from "react-dom/client";

import { UploadButton } from "./uploadthing";

function App() {
  return (
    <main className="flex flex-col items-center gap-4 py-8">
      <h1 className="text-xl font-bold">Express + Vite + Uploadthing</h1>
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
