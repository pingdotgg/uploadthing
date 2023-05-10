import { useCallback, useState } from "react";
import type { FileRouter } from "uploadthing/server";
import { DANGEROUS__uploadFiles } from "uploadthing/client";

import { useEvent } from "./useEvent";

// TODO: Handle file size and allowed types somehow. Probably through fetching from endpoint?
export const useUploadThing = <T extends string>({
  endpoint,
  onClientUploadComplete,
}: {
  endpoint: T;
  onClientUploadComplete?: () => void;
}) => {
  const [isUploading, setUploading] = useState(false);

  const startUpload = useEvent(async (files: File[]) => {
    setUploading(true);
    const resp = await DANGEROUS__uploadFiles(files, endpoint);
    setUploading(false);
    onClientUploadComplete?.();
    return resp;
  });
  return {
    startUpload,
    isUploading,
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
