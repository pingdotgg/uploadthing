import { useState } from "react";

import type { ExpandedRouteConfig } from "@uploadthing/shared";
import { DANGEROUS__uploadFiles } from "uploadthing/client";
import type { FileRouter, inferEndpointInput } from "uploadthing/server";

import { useEvent } from "./utils/useEvent";
import useFetch from "./utils/useFetch";

type EndpointMetadata = {
  slug: string;
  config: ExpandedRouteConfig;
}[];

const useEndpointMetadata = (endpoint: string) => {
  const { data } = useFetch<EndpointMetadata>("/api/uploadthing");
  return data?.find((x) => x.slug === endpoint);
};

export type UseUploadthingProps = {
  onClientUploadComplete?: (
    res?: Awaited<ReturnType<typeof DANGEROUS__uploadFiles>>,
  ) => void;
  onUploadError?: (e: Error) => void;
};


export const INTERNAL_uploadthingHookGen = <TRouter extends FileRouter>() => {
  const useUploadThing = <TEndpoint extends keyof TRouter>(
    endpoint: TEndpoint,
    opts?: UseUploadthingProps,
  ) => {
    const [isUploading, setUploading] = useState(false);
    const [uploadProgress, setUploadProgress] = useState(new Map());

    const permittedFileInfo = useEndpointMetadata(endpoint as string);

    type InferredInput = inferEndpointInput<TRouter[typeof endpoint]>;
    type FuncInput = undefined extends InferredInput
      ? [files: File[], input?: undefined]
      : [files: File[], input: InferredInput];

    const startUpload = useEvent(async (...args: FuncInput) => {
      const [files, input] = args;
      setUploading(true);
      try {
        const res = await DANGEROUS__uploadFiles({
          files,
          endpoint: endpoint as string,
          input,
          onUploadProgress: (progress) => setUploadProgress((up) => new Map(up.set(progress.file, progress.progress))),
        });
        setUploading(false);
        setUploadProgress(() => new Map())
        opts?.onClientUploadComplete?.(res);
        return res;
      } catch (e) {
        setUploading(false);
        setUploadProgress(() => new Map())
        opts?.onUploadError?.(e as Error);
        return;
      }
    });
    return {
      startUpload,
      isUploading,
      permittedFileInfo,
      uploadProgress,
    } as const;
  };

  return useUploadThing;
};

export const generateReactHelpers = <TRouter extends FileRouter>() => {
  return {
    useUploadThing: INTERNAL_uploadthingHookGen<TRouter>(),
    uploadFiles: DANGEROUS__uploadFiles<TRouter>,
  } as const;
};

export type FullFile = {
  file: File;
  contents: string;
};
