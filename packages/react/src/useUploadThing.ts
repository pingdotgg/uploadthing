import { useRef, useState } from "react";

import type { ExpandedRouteConfig } from "@uploadthing/shared";
import { DANGEROUS__uploadFiles } from "uploadthing/client";
import type { FileRouter, inferEndpointInput } from "uploadthing/server";

import { useEvent } from "./utils/useEvent";
import useFetch from "./utils/useFetch";

type EndpointMetadata = {
  slug: string;
  // Not using the ExpandedRouteConfig type "fixes" the declaration issue, but we don't want to do that
  // config: ExpandedRouteConfig;
  config: any;
}[];

const useEndpointMetadata = (endpoint: string) => {
  const { data } = useFetch<EndpointMetadata>("/api/uploadthing");
  return data?.find((x) => x.slug === endpoint);
};

export type UseUploadthingProps = {
  onClientUploadComplete?: (
    res?: Awaited<ReturnType<typeof DANGEROUS__uploadFiles>>,
  ) => void;
  onUploadProgress?: (p: number) => void;
  onUploadError?: (e: Error) => void;
};

export const INTERNAL_uploadthingHookGen = <TRouter extends FileRouter>() => {
  const useUploadThing = <TEndpoint extends keyof TRouter>(
    endpoint: TEndpoint,
    opts?: UseUploadthingProps,
  ) => {
    const [isUploading, setUploading] = useState(false);
    const uploadProgress = useRef(0);
    const fileProgress = useRef<Map<string, number>>(new Map());

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
          onUploadProgress: (progress) => {
            if (!opts?.onUploadProgress) return;
            fileProgress.current.set(progress.file, progress.progress);
            let sum = 0;
            fileProgress.current.forEach((p) => {
              sum += p;
            });
            const averageProgress =
              Math.floor(sum / fileProgress.current.size / 10) * 10;
            if (averageProgress !== uploadProgress.current) {
              opts?.onUploadProgress?.(averageProgress);
              uploadProgress.current = averageProgress;
            }
          },
        });
        setUploading(false);
        fileProgress.current = new Map();
        uploadProgress.current = 0;
        opts?.onClientUploadComplete?.(res);
        return res;
      } catch (e) {
        setUploading(false);
        fileProgress.current = new Map();
        uploadProgress.current = 0;
        opts?.onUploadError?.(e as Error);
        return;
      }
    });

    return {
      startUpload,
      isUploading,
      permittedFileInfo,
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
