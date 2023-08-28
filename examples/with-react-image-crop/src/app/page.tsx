"use client";

import { useState } from "react";

import { ImageCropper } from "./image-cropper";

export default function Page() {
  const [imgSrc, setImgSrc] = useState("");

  return (
    <div>
      <div>
        <h1>Image Cropper</h1>
        <p>
          This is a simple example of using the{" "}
          <a
            href="https://www.npmjs.com/package/react-image-crop"
            target="_blank"
            rel="noreferrer"
          >
            react-image-crop
          </a>{" "}
          package to crop an image before uploading it.
        </p>
      </div>

      <label>
        Select an image to crop:
        <input
          type="file"
          onChange={(e) => {
            const file = e.target.files?.[0];
            if (!file) return;

            const reader = new FileReader();
            reader.addEventListener("load", () => {
              setImgSrc(reader.result?.toString() ?? "");
            });
            reader.readAsDataURL(file);
          }}
        />
      </label>

      <ImageCropper src={imgSrc} />
    </div>
  );
}
