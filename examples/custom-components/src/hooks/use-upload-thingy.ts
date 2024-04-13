import * as React from "react";

import { type UseUploadthingProps } from "@uploadthing/react";

import { type OurFileRouter } from "~/app/api/uploadthing/core";
import { useUploadThing } from "~/lib/uploadthing";

interface UseUploadThingyProps
  extends UseUploadthingProps<OurFileRouter, keyof OurFileRouter> {}

export function useUploadThingy(
  endpoint: keyof OurFileRouter,
  props: UseUploadThingyProps = {},
) {
  const [progress, setProgress] = React.useState(0);
  const { startUpload, isUploading } = useUploadThing(endpoint, {
    onUploadProgress: () => {
      setProgress(progress);
    },
    ...props,
  });

  return {
    startUpload,
    isUploading,
    progress,
  };
}
