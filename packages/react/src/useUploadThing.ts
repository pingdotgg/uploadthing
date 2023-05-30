import { useState } from "react";

import { useEndpointMetadata } from "@uploadthing/shared/useEndpointMetadata";
import { useEvent } from "@uploadthing/shared/useEvent";
import { DANGEROUS__uploadFiles } from "uploadthing/client";
import type { FileRouter } from "uploadthing/server";

export const useUploadThing = <T extends string>({
  endpoint,
  onClientUploadComplete,
  onUploadError,
}: {
  endpoint: T;
  onClientUploadComplete?: (
    res?: Awaited<ReturnType<typeof DANGEROUS__uploadFiles>>,
  ) => void;
  onUploadError?: (e: Error) => void;
}) => {
  const [isUploading, setUploading] = useState(false);

  const permittedFileInfo = useEndpointMetadata(endpoint);

  const startUpload = useEvent(async (files: File[]) => {
    setUploading(true);
    try {
      const res = await DANGEROUS__uploadFiles(files, endpoint);
      setUploading(false);
      onClientUploadComplete?.(res);
      return res;
    } catch (e) {
      setUploading(false);
      onUploadError?.(e as Error);
      return;
    }
  });
  return {
    startUpload,
    isUploading,
    permittedFileInfo,
  } as const;
};

export const generateReactHelpers = <TRouter extends FileRouter>() => {
  type TRouterKey = keyof TRouter extends string ? keyof TRouter : string;

  return {
    useUploadThing: useUploadThing<TRouterKey>,
    uploadFiles: DANGEROUS__uploadFiles<TRouterKey>,
  } as const;
};

export type FullFile = {
  file: File;
  contents: string;
};
