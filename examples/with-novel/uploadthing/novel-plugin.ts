import { createImageUpload } from "novel/plugins";
import { toast } from "sonner";

import { isValidFileSize, isValidFileType } from "uploadthing/client";

import { getRouteConfig, uploadFiles } from "./client";

const preloadImage = (url: string, tries = 0, maxTries = 10) =>
  new Promise<string>((resolve, reject) => {
    const image = new Image();
    image.src = url;
    image.onload = () => resolve(url);
    image.onerror = (e) => {
      if (tries < maxTries) {
        preloadImage(url, ++tries).then(resolve);
      } else {
        toast.error(
          "Image was uploaded, but failed to preload. Please refresh your browser, and try again.",
        );
        reject(e);
      }
    };
  });

export const uploadFn = createImageUpload({
  onUpload: (file) => {
    /**
     * Upload the file to the server and preload the image in the browser
     */
    const uploadPromise = uploadFiles((rr) => rr.imageUploader, {
      files: [file],
    });

    return new Promise<string>((resolve) => {
      toast.promise(
        uploadPromise.then(async (res) => {
          const [uploadedFileData] = res;
          const imageUrl = await preloadImage(uploadedFileData!.url);
          resolve(imageUrl);
        }),
        {
          loading: "Uploading image...",
          success: "Image uploaded successfully.",
          error: (e) => e.message,
        },
      );
    });
  },
  validateFn: (file) => {
    const config = getRouteConfig((rr) => rr.imageUploader);
    if (!isValidFileType(file, config)) {
      toast.error("File type not supported.");
      return false;
    }
    if (!isValidFileSize(file, config)) {
      toast.error("File size too big.");
      return false;
    }
    return true;
  },
});
