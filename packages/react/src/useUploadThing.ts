import * as React from "react";

import { DANGEROUS__uploadFiles, getUtUrl } from "uploadthing/client";
import type { ExpandedRouteConfig, FileRouter } from "uploadthing/server";

import { useEvent } from "./utils/useEvent";
import useFetch from "./utils/useFetch";

const fetchEndpointData = async () => {
  const url = getUtUrl();
  const res = await fetch(url);
  const data = (await res.json()) as any[];
  return data as EndpointMetadata;
};

type EndpointMetadata = {
  slug: string;
  config: ExpandedRouteConfig;
}[];
const useEndpointMetadataRSC = (endpoint: string) => {
  // Trigger suspense
  const promiseRef = React.useRef<Promise<EndpointMetadata>>();
  const data = React.use((promiseRef.current ??= fetchEndpointData()));

  // TODO: Log on errors in dev

  return data?.find((x) => x.slug === endpoint);
};

const useEndpointMetadataStd = (endpoint: string) => {
  const { data } = useFetch<EndpointMetadata>("/api/uploadthing");

  // TODO: Log on errors in dev

  return data?.find((x) => x.slug === endpoint);
};

const useEndpointMetadata =
  typeof React.use === "function"
    ? useEndpointMetadataRSC
    : useEndpointMetadataStd;

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
  const [isUploading, setUploading] = React.useState(false);

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
