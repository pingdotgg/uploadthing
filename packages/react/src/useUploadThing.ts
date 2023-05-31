import { use, useRef, useState } from "react";

import { DANGEROUS__uploadFiles, getUtUrl } from "uploadthing/client";
import type { ExpandedRouteConfig, FileRouter } from "uploadthing/server";

import { useEvent } from "./utils/useEvent";
import useFetch from "./utils/useFetch";

const fetchEndpointData = async (endpoint: string) => {
  const url = getUtUrl();
  const res = await fetch(url);
  const data = (await res.json()) as any[];
  return data as EndpointMetadata;
};

type EndpointMetadata = {
  slug: string;
  config: ExpandedRouteConfig;
}[];
const useEndpointMetadata = (endpoint: string) => {
  // let { data } = useFetch<EndpointMetadata>("/api/uploadthing");
  const promiseRef = useRef<Promise<EndpointMetadata>>();

  // Trigger suspense
  const data2 = use((promiseRef.current ??= fetchEndpointData(endpoint)));

  // TODO: Log on errors in dev

  return data2?.find((x) => x.slug === endpoint);
};

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
