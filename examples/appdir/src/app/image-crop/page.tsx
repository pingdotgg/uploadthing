/* eslint-disable jsx-a11y/label-has-associated-control */
/* eslint-disable react/jsx-filename-extension */
/* eslint-disable react/react-in-jsx-scope */

'use client';

import { useState } from 'react';

import { ImageCropper } from './image-cropper.tsx';

export default function Page() {
  const [imgSrc, setImgSrc] = useState('');

  return (
    <div className="grid min-h-screen place-items-center">
      <div className="space-y-4">
        <div>
          <h1 className="text-xl font-bold">Image Cropper</h1>
          <p>
            This is a simple example of using the
            {' '}
            <a
              href="
https://www.npmjs.com/package/react-image-crop"
              target="_blank"
              rel="noreferrer"
            >
              react-image-crop
            </a>
            {' '}
            package to crop an image before uploading it.
          </p>
        </div>

        <label className="flex flex-col gap-1">
          Select an image to crop:
          <input
            type="file"
            onChange={(e) => {
              const file = e.target.files?.[0];
              if (!file) return;

              const reader = new FileReader();
              reader.addEventListener('load', () => {
                setImgSrc(reader.result?.toString() ?? '');
              });
              reader.readAsDataURL(file);
            }}
          />
        </label>

        <ImageCropper src={imgSrc} />
      </div>
    </div>
  );
}
