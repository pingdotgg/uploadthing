import { createSignal } from "solid-js";

import { DANGEROUS__uploadFiles } from "uploadthing/client";
import type { ExpandedRouteConfig, FileRouter } from "uploadthing/server";

import { createFetch } from "./utils/createFetch";

type EndpointMetadata = {
  slug: string;
  config: ExpandedRouteConfig;
}[];

const createEndpointMetadata = (endpoint: string, url?: string) => {
  const dataGetter = createFetch<EndpointMetadata>(
    `${url ?? ""}/api/uploadthing`,
  );
  return () => dataGetter()?.data?.find((x) => x.slug === endpoint);
};

export const useUploadThing = <T extends string>({
  endpoint,
  onClientUploadComplete,
  url,
  onUploadError,
}: {
  endpoint: T;
  onClientUploadComplete?: (
    res?: Awaited<ReturnType<typeof DANGEROUS__uploadFiles>>,
  ) => void;
  onUploadError?: (e: Error) => void;
  url?: string;
}) => {
  const [isUploading, setUploading] = createSignal(false);
  const permittedFileInfo = createEndpointMetadata(endpoint, url);

  const startUpload = async (files: File[]) => {
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
  };

  return {
    startUpload,
    isUploading,
    permittedFileInfo,
  } as const;
};

export const generateSolidHelpers = <TRouter extends FileRouter>() => {
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
