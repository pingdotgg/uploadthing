import { createSignal } from "solid-js";

import type { ExpandedRouteConfig } from "@uploadthing/shared";
import type { UploadFileResponse } from "uploadthing/client";
import { DANGEROUS__uploadFiles } from "uploadthing/client";
import type { FileRouter, inferEndpointInput } from "uploadthing/server";

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

export type UseUploadthingProps = {
  onUploadProgress?: (p: number) => void;
  onUploadBegin?: (fileName: string) => void;
  onClientUploadComplete?: (res?: UploadFileResponse[]) => void;
  onUploadError?: (e: Error) => void;
  url?: string;
};

export const INTERNAL_uploadthingHookGen = <TRouter extends FileRouter>() => {
  const useUploadThing = <TEndpoint extends keyof TRouter>(
    endpoint: TEndpoint,
    opts?: UseUploadthingProps,
  ) => {
    const [isUploading, setUploading] = createSignal(false);
    const permittedFileInfo = createEndpointMetadata(
      endpoint as string,
      opts?.url,
    );
    let uploadProgress = 0;
    let fileProgress = new Map();

    type InferredInput = inferEndpointInput<TRouter[typeof endpoint]>;
    type FuncInput = undefined extends InferredInput
      ? [files: File[], input?: undefined]
      : [files: File[], input: InferredInput];

    const startUpload = async (...args: FuncInput) => {
      const [files, input] = args;
      setUploading(true);
      try {
        const res = await DANGEROUS__uploadFiles({
          files,
          endpoint: endpoint as string,
          input,
          onUploadProgress: (progress) => {
            if (!opts?.onUploadProgress) return;
            fileProgress.set(progress.file, progress.progress);
            let sum = 0;
            fileProgress.forEach((p) => {
              sum += p;
            });
            const averageProgress =
              Math.floor(sum / fileProgress.size / 10) * 10;
            if (averageProgress !== uploadProgress) {
              opts?.onUploadProgress?.(averageProgress);
              uploadProgress = averageProgress;
            }
          },
          onUploadBegin({ file }) {
            if (!opts?.onUploadBegin) return;

            opts.onUploadBegin(file);
          },
        });
        setUploading(false);
        fileProgress = new Map();
        uploadProgress = 0;
        opts?.onClientUploadComplete?.(res);
        return res;
      } catch (e) {
        setUploading(false);
        fileProgress = new Map();
        uploadProgress = 0;
        opts?.onUploadError?.(e as Error);
        return;
      }
    };

    return {
      startUpload,
      isUploading,
      permittedFileInfo,
    } as const;
  };

  return useUploadThing;
};

export const generateSolidHelpers = <TRouter extends FileRouter>() => {
  return {
    useUploadThing: INTERNAL_uploadthingHookGen<TRouter>(),
    uploadFiles: DANGEROUS__uploadFiles<TRouter>,
  } as const;
};

export type FullFile = {
  file: File;
  contents: string;
};
