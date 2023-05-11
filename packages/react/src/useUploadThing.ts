import { useCallback, useState } from "react";
import type { FileRouter } from "uploadthing/server";
import { DANGEROUS__uploadFiles } from "uploadthing/client";

import { useEvent } from "./utils/useEvent";
import useFetch from "./utils/useFetch";

type EndpointMetadata = {
  slug: string;
  maxSize: string;
  maxFiles?: number;
  fileTypes: string[];
}[];
const useEndpointMetadata = (endpoint: string) => {
  const { data } = useFetch<EndpointMetadata>("/api/uploadthing");

  // TODO: Log on errors in dev

  return data?.find((x) => x.slug === endpoint);
};

export const useUploadThing = <T extends string>({
  endpoint,
  onClientUploadComplete,
}: {
  endpoint: T;
  onClientUploadComplete?: () => void;
}) => {
  const [isUploading, setUploading] = useState(false);

  const permittedFileInfo = useEndpointMetadata(endpoint);

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
