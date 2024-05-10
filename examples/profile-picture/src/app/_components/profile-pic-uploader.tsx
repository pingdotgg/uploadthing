"use client";

import * as React from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/ui/card";
import { useUploadThing } from "@/uploadthing/client";
import { invariant } from "@/utils";
import { Loader2 } from "lucide-react";
import { User } from "next-auth";
import Cropper, { Area, Point } from "react-easy-crop";
import { toast } from "sonner";

import {
  generateMimeTypes,
  generatePermittedFileTypes,
} from "uploadthing/client";

type FileWithPreview = File & { preview: string };

// TODO: Pull from server config
const IMAGE_SIZE = { w: 400, h: 400 };

export function ProfilePictureCard(props: { user: User }) {
  const [file, setFile] = React.useState<FileWithPreview | null>(null);
  const [crop, setCrop] = React.useState<Point>({ x: 0, y: 0 });
  const [zoom, setZoom] = React.useState(1);
  const [croppedArea, setCroppedArea] = React.useState<Area | null>(null);

  const [output, setOutput] = React.useState<FileWithPreview | null>(null);
  React.useEffect(() => {
    if (file && croppedArea) {
      cropAndScaleImage(file, croppedArea, IMAGE_SIZE).then((image) => {
        setOutput(image);
      });
    }
  }, [file, crop, croppedArea]);

  const router = useRouter();
  const { isUploading, startUpload, permittedFileInfo } = useUploadThing(
    "profilePicture",
    {
      onClientUploadComplete: () => {
        if (file) URL.revokeObjectURL(file.preview);
        if (output) URL.revokeObjectURL(output.preview);
        setFile(null);
        setOutput(null);
        router.refresh();
      },
      onUploadError: () => toast.error("Failed to upload profile picture"),
    },
  );
  const routeConfig = permittedFileInfo?.config;

  const uploadCroppedImage = async () => {
    if (!croppedArea || !file || !output) return;
    // const croppedFile = await drawImage(file, croppedArea, IMAGE_SIZE);
    startUpload([output]);
  };

  return (
    <Card>
      <div className="flex justify-between">
        <CardHeader>
          <CardTitle>Profile Picture</CardTitle>
          <CardDescription>
            Upload a profile picture for your account.
          </CardDescription>
        </CardHeader>
        {props.user.image && !file && (
          <div className="p-6">
            <label>
              <img
                src={props.user.image}
                alt="Profile Picture"
                className="size-32 cursor-pointer rounded-full hover:opacity-75"
              />
              <input
                type="file"
                accept={generateMimeTypes(
                  generatePermittedFileTypes(routeConfig).fileTypes,
                ).join(",")}
                className="hidden"
                onChange={(e) => {
                  if (!e.target.files?.[0]) return;
                  const file = e.target.files[0];
                  const preview = URL.createObjectURL(file);
                  setFile(Object.assign(file, { preview }));
                }}
              />
            </label>
          </div>
        )}
      </div>
      {file && (
        <CardContent>
          <div className="relative h-full min-h-[400px] w-full">
            <Cropper
              maxZoom={5}
              image={file?.preview}
              aspect={IMAGE_SIZE.w / IMAGE_SIZE.h}
              crop={crop}
              zoom={zoom}
              objectFit="contain"
              onCropChange={setCrop}
              onZoomChange={setZoom}
              onCropComplete={(_, area) => setCroppedArea(area)}
            />
          </div>
          {output && (
            <div className="h-[400px] w-full">
              <img src={output.preview} alt="Cropped image" />
            </div>
          )}
        </CardContent>
      )}
      <CardFooter className="justify-between border-t px-6 py-4">
        <p className="text-muted-foreground text-sm">
          Click on the profile picture to upload a new one.
        </p>
        {file && (
          <Button size="sm" onClick={uploadCroppedImage} disabled={isUploading}>
            {isUploading && <Loader2 className="h-4 w-4 animate-spin" />}
            Save
          </Button>
        )}
      </CardFooter>
    </Card>
  );
}

/**
 * Draw image onto canvas using the cropped area.
 * The resulting image should be of size `imageSize`, and  be scaled to fit.
 * Account for the device pixel ratio to ensure the image is crisp when scaled.
 */
const cropAndScaleImage = async (
  imageFile: FileWithPreview,
  crop: Area,
  imageSize: { w: number; h: number },
) => {
  const image = new Image();
  image.src = imageFile.preview;
  await new Promise((resolve) => (image.onload = resolve));

  /**
   * First, lets crop the image to the desired area.
   */
  const cropCanvas = document.createElement("canvas");
  const ctx = cropCanvas.getContext("2d");
  invariant(ctx, "Could not get canvas context");

  cropCanvas.width = crop.width;
  cropCanvas.height = crop.height;

  ctx.drawImage(
    image,
    crop.x,
    crop.y,
    crop.width,
    crop.height,
    0,
    0,
    crop.width,
    crop.height,
  );

  /**
   * Then, let's scale the cropped image to the desired size.
   */
  const scaledCanvas = document.createElement("canvas");
  const scaledCtx = scaledCanvas.getContext("2d");
  invariant(scaledCtx, "Could not get canvas context");

  scaledCanvas.width = imageSize.w;
  scaledCanvas.height = imageSize.h;

  scaledCtx.drawImage(
    cropCanvas,
    0,
    0,
    cropCanvas.width,
    cropCanvas.height,
    0,
    0,
    imageSize.w,
    imageSize.h,
  );

  const blob = await new Promise<Blob>((resolve, reject) => {
    scaledCanvas.toBlob((blob) => {
      if (blob) {
        resolve(blob);
      } else {
        reject(new Error("Could not convert canvas to blob"));
      }
    });
  });

  return Object.assign(
    new File([blob], imageFile.name, { type: imageFile.type }),
    { preview: scaledCanvas.toDataURL("image/png") },
  );
};
