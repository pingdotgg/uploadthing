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

const createEndpointMetadata = (url: string, endpoint: string) => {
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
};

export const INTERNAL_uploadthingHookGen = <
  TRouter extends FileRouter,
>(initOpts: {
  /**
   * Absolute URL to the UploadThing API endpoint
   * @example http://localhost:3000/api/uploadthing
   * @example https://www.example.com/api/uploadthing
   */
  url: string;
}) => {
  const useUploadThing = <TEndpoint extends keyof TRouter>(
    endpoint: TEndpoint,
    opts?: UseUploadthingProps,
  ) => {
    const [isUploading, setUploading] = createSignal(false);
    const permittedFileInfo = createEndpointMetadata(
      initOpts.url,
      endpoint as string,
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
      opts?.onUploadProgress?.(0);
      try {
        const res = await DANGEROUS__uploadFiles(
          {
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
          },
          {
            url: initOpts.url,
          },
        );
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

export const generateSolidHelpers = <TRouter extends FileRouter>(initOpts: {
  /**
   * Absolute URL to the UploadThing API endpoint
   * @example http://localhost:3000/api/uploadthing
   * @example https://www.example.com/api/uploadthing
   */
  url: string;
}) => {
  return {
    useUploadThing: INTERNAL_uploadthingHookGen<TRouter>(initOpts),
    uploadFiles: (props: Parameters<typeof DANGEROUS__uploadFiles>[0]) =>
      DANGEROUS__uploadFiles<TRouter>(props, { url: initOpts.url }),
  } as const;
};

export type FullFile = {
  file: File;
  contents: string;
};
