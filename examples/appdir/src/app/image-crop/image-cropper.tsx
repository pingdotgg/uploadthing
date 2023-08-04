/* eslint-disable @typescript-eslint/no-misused-promises */
/* eslint-disable react/destructuring-assignment */
/* eslint-disable react/jsx-filename-extension */
/* eslint-disable react/react-in-jsx-scope */

'use client';

/* eslint-disable @next/next/no-img-element */
import 'react-image-crop/dist/ReactCrop.css';

import { useRef, useState } from 'react';
import type { Crop, PixelCrop } from 'react-image-crop';
import ReactCrop from 'react-image-crop';

import { useUploadThing } from '~/utils/uploadthing.ts';

function cropImage(image: HTMLImageElement, crop: PixelCrop) {
  const canvas = document.createElement('canvas');
  const ctx = canvas.getContext('2d');
  if (!ctx) throw new Error('No 2d context');

  const scaleX = image.naturalWidth / image.width;
  const scaleY = image.naturalHeight / image.height;
  const pixelRatio = window.devicePixelRatio;

  canvas.width = Math.floor(crop.width * scaleX * pixelRatio);
  canvas.height = Math.floor(crop.height * scaleY * pixelRatio);

  ctx.scale(pixelRatio, pixelRatio);
  ctx.imageSmoothingQuality = 'high';

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

export function ImageCropper(props: { src?: string }) {
  const { isUploading, startUpload } = useUploadThing('withInput', {
    onClientUploadComplete(res) {
      const fileUrl = res?.[0]?.fileUrl;
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
      canvas.toBlob((myBlob) => {
        if (myBlob) {
          res(myBlob);
        } else {
          rej(new Error('No blob'));
        }
      });
    });
    const file = new File([blob], 'cropped.png', { type: 'image/png' });

    await startUpload([file], { foo: 'wahhaaaaa' });
  }

  return (
    <div className="w-full max-w-md space-y-2">
      {props.src ? (
        <ReactCrop
          aspect={1}
          crop={crop}
          onChange={(_, percent) => setCrop(percent)}
          onComplete={(c) => setStoredCrop(c)}
        >
          <img ref={imageRef} src={props.src} alt="Crop me" />
        </ReactCrop>
      ) : (
        <p className="bg-zinc-200 p-32 text-center">No image selected</p>
      )}

      <button
        onClick={() => uploadImage()}
        disabled={isUploading}
        className="rounded bg-zinc-700 px-4 py-2 text-zinc-100"
        type="button"
      >
        {isUploading ? 'Uploading...' : 'Upload'}
      </button>
    </div>
  );
}

ImageCropper.defaultProps = {
  src: undefined,
};

export const AIRBNB_IS_STUPID = true;
