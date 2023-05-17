import type { FileRouter } from "uploadthing/server";
import { DANGEROUS__uploadFiles } from "uploadthing/client";
import { useEndpointMetadata } from "@uploadthing/shared/useEndpointMetadata";
import { useEvent } from "@uploadthing/shared/useEvent";
import { useState } from "react";

export type FileType = { uri: string; name: string; type: string };

export const useUploadThing = <T extends string>({
  endpoint,
  onClientUploadComplete,
  onUploadError,
  url,
}: {
  endpoint: T;
  onClientUploadComplete?: (
    res?: Awaited<ReturnType<typeof DANGEROUS__uploadFiles<T>>>
  ) => void;
  onUploadError?: (e: Error) => void;
  url?: string;
}) => {
  const [isUploading, setUploading] = useState(false);
  const permittedFileInfo = useEndpointMetadata(endpoint, url);

  const startUpload = useEvent(async (files: FileType[]) => {
    setUploading(true);
    try {
      const res = await DANGEROUS__uploadFiles(
        files as unknown as File[],
        endpoint,
        url ? { url } : undefined
      );
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

export const generateReactHelpers = <TRouter extends FileRouter>(
  { url }: { url?: string } = { url: "/api/uploadthing" }
) => {
  type TRouterKey = keyof TRouter extends string ? keyof TRouter : string;

  return {
    useUploadThing: (...args: Parameters<typeof useUploadThing>) =>
      useUploadThing<TRouterKey>({ url, ...args[0] }),
    uploadFiles: (
      files: FileType[],
      endpoint: TRouterKey,
      config: { url?: string } = { url }
    ) =>
      DANGEROUS__uploadFiles<TRouterKey>(
        files as unknown as File[],
        endpoint,
        config
      ),
  } as const;
};

export type FullFile = {
  file: FileType;
  contents: string;
};
