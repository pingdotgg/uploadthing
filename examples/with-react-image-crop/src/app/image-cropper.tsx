/* eslint-disable @next/next/no-img-element */
"use client";

import "react-image-crop/dist/ReactCrop.css";

import { useRef, useState } from "react";
import type { Crop, PixelCrop } from "react-image-crop";
import ReactCrop from "react-image-crop";

import { useUploadThing } from "~/utils/uploadthing";

export function ImageCropper(props: { src?: string }) {
  const { isUploading, startUpload } = useUploadThing("proileImage", {
    /**
     * @see https://docs.uploadthing.com/api-reference/react#useuploadthing
     */
    onClientUploadComplete(res) {
      console.log("Client upload complete", res);
      const fileUrl = res?.[0]?.url;
      if (fileUrl) window.location.href = fileUrl;
    },
  });

  const [crop, setCrop] = useState<Crop>();
  const [storedCrop, setStoredCrop] = useState<PixelCrop>();
  const imageRef = useRef<HTMLImageElement>(null);

  async function uploadImage() {
    if (!imageRef.current || !storedCrop) return;
    const canvas = cropImage(imageRef.current, storedCrop);

    const blob = await new Promise<Blob>((res, rej) => {
      canvas.toBlob((blob) => {
        blob ? res(blob) : rej("No blob");
      });
    });
    const file = new File([blob], "cropped.png", { type: "image/png" });

    await startUpload([file]);
  }

  return (
    <>
      {props.src ? (
        <ReactCrop
          aspect={1}
          crop={crop}
          onChange={(_, percent) => setCrop(percent)}
          onComplete={(c) => setStoredCrop(c)}
        >
          <img ref={imageRef} src={props.src} alt="Crop me" height={400} />
        </ReactCrop>
      ) : (
        <p>No image selected</p>
      )}

      <button onClick={() => void uploadImage()} disabled={isUploading}>
        {isUploading ? "Uploading..." : "Upload"}
      </button>
    </>
  );
}

function cropImage(image: HTMLImageElement, crop: PixelCrop) {
  const canvas = document.createElement("canvas");
  const ctx = canvas.getContext("2d");
  if (!ctx) throw new Error("No 2d context");

  const scaleX = image.naturalWidth / image.width;
  const scaleY = image.naturalHeight / image.height;
  const pixelRatio = window.devicePixelRatio;

  canvas.width = Math.floor(crop.width * scaleX * pixelRatio);
  canvas.height = Math.floor(crop.height * scaleY * pixelRatio);

  ctx.scale(pixelRatio, pixelRatio);
  ctx.imageSmoothingQuality = "high";

  const cropX = crop.x * scaleX;
  const cropY = crop.y * scaleY;

  const centerX = image.naturalWidth / 2;
  const centerY = image.naturalHeight / 2;

  ctx.save();

  ctx.translate(-cropX, -cropY);
  ctx.translate(centerX, centerY);
  ctx.translate(-centerX, -centerY);
  ctx.drawImage(
    image,
    0,
    0,
    image.naturalWidth,
    image.naturalHeight,
    0,
    0,
    image.naturalWidth,
    image.naturalHeight,
  );

  ctx.restore();

  return canvas;
}
