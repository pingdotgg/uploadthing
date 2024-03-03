import React, { useEffect } from "react";
import ReactDOM from "react-dom/client";

import { BACKEND_URL } from "./constants";
import { UploadButton } from "./uploadthing";

function App() {
  return (
    <main className="flex flex-col items-center gap-4 py-8">
      <WhatServer />
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

function WhatServer() {
  const [serverResponse, setServerResponse] = React.useState<string>("");
  useEffect(() => {
    fetch(new URL("/api", BACKEND_URL))
      .then((res) => res.text())
      .then(setServerResponse);
  }, []);

  return (
    <h1 className="text-xl font-bold">
      {serverResponse || "Getting server..."}
    </h1>
  );
}

ReactDOM.createRoot(document.getElementById("root")!).render(
  <React.StrictMode>
    <App />
  </React.StrictMode>,
);
