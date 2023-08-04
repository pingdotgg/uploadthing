import { createSignal } from 'solid-js';

import type { ExpandedRouteConfig } from '@uploadthing/shared';
import { dangerousUploadFiles } from 'uploadthing/client';
import type { FileRouter, inferEndpointInput } from 'uploadthing/server';

import { createFetch } from './utils/createFetch.ts';

type EndpointMetadata = {
  slug: string;
  config: ExpandedRouteConfig;
}[];

const createEndpointMetadata = (endpoint: string, url?: string) => {
  const dataGetter = createFetch<EndpointMetadata>(
    `${url ?? ''}/api/uploadthing`,
  );
  return () => dataGetter()?.data?.find((x) => x.slug === endpoint);
};

const onUploadProgressExample = (p: number) => {
  if (p) return undefined;
  return undefined;
};

const onClientUploadCompleteExample = (
  res?: Awaited<ReturnType<typeof dangerousUploadFiles>>,
) => {
  if (res) return undefined;
  return undefined;
};

const onUploadErrorExample = (e: Error): undefined | void => {
  if (e) return undefined;
  return undefined;
};

export type UseUploadthingProps = {
  onUploadProgress?: typeof onUploadProgressExample;
  onClientUploadComplete?: typeof onClientUploadCompleteExample;
  onUploadError?: typeof onUploadErrorExample;
  url?: string;
};

export const internalUploadthingHookGen = <TRouter extends FileRouter>() => {
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
        const res = (await dangerousUploadFiles({
          files,
          endpoint: endpoint as string,
          input,
          onUploadProgress: (progress: { file: string; progress: number }) => {
            if (!opts?.onUploadProgress) return;
            fileProgress.set(progress.file, progress.progress);
            let sum = 0;
            fileProgress.forEach((p) => {
              sum += p;
            });
            const averageProgress = Math.floor(sum / fileProgress.size / 10) * 10;
            if (averageProgress !== uploadProgress) {
              opts?.onUploadProgress?.(averageProgress);
              uploadProgress = averageProgress;
            }
          },
        })) as unknown as Awaited<ReturnType<typeof dangerousUploadFiles>>;
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
        return undefined;
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

export const generateSolidHelpers = <TRouter extends FileRouter>() => ({
  useUploadThing: internalUploadthingHookGen<TRouter>(),
  uploadFiles: dangerousUploadFiles<TRouter>,
} as const);

export type FullFile = {
  file: File;
  contents: string;
};
