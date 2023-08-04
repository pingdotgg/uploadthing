import { useRef, useState } from 'react';

import type { ExpandedRouteConfig } from '@uploadthing/shared';
import { UploadThingError } from '@uploadthing/shared';
import { dangerousUploadFiles } from 'uploadthing/client';
import type {
  FileRouter,
  inferEndpointInput,
  inferErrorShape,
} from 'uploadthing/server';

import { useEvent } from './utils/useEvent.ts';
import useFetch from './utils/useFetch.ts';

type EndpointMetadata = {
  slug: string;
  config: ExpandedRouteConfig;
}[];

const useEndpointMetadata = (endpoint: string) => {
  const { data } = useFetch<EndpointMetadata>('/api/uploadthing');
  return data?.find((x) => x.slug === endpoint);
};

export type UseUploadthingProps<TRouter extends FileRouter> = {
  onClientUploadComplete?: (
    // eslint-disable-next-line no-unused-vars
    res?: Awaited<ReturnType<typeof dangerousUploadFiles>>,
  ) => void;
  // eslint-disable-next-line no-unused-vars
  onUploadProgress?: (p: number) => void;
  // eslint-disable-next-line no-unused-vars
  onUploadError?: (e: UploadThingError<inferErrorShape<TRouter>>) => void;
};

const fatalClientError = new UploadThingError({
  code: 'INTERNAL_CLIENT_ERROR',
  message: 'Something went wrong. Please report this to UploadThing.',
});

export const internalUploadthingHookGen = <TRouter extends FileRouter>() => {
  const useUploadThing = <TEndpoint extends keyof TRouter>(
    endpoint: TEndpoint,
    opts?: UseUploadthingProps<TRouter>,
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
        const res = await dangerousUploadFiles({
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
            const averageProgress = Math.floor(sum / fileProgress.current.size / 10) * 10;
            if (averageProgress !== uploadProgress.current) {
              opts?.onUploadProgress?.(averageProgress);
              uploadProgress.current = averageProgress;
            }
          },
        });

        opts?.onClientUploadComplete?.(res);
        return res;
      } catch (e) {
        const error = e instanceof UploadThingError ? e : fatalClientError;
        opts?.onUploadError?.(
          error as UploadThingError<inferErrorShape<TRouter>>,
        );
      } finally {
        setUploading(false);
        fileProgress.current = new Map();
        uploadProgress.current = 0;
      }
      return undefined;
    });

    return {
      startUpload,
      isUploading,
      permittedFileInfo,
    } as const;
  };

  return useUploadThing;
};

export const generateReactHelpers = <TRouter extends FileRouter>() => (
  {
    useUploadThing: internalUploadthingHookGen<TRouter>(),
    uploadFiles: dangerousUploadFiles<TRouter>,
  } as const
);

export type FullFile = {
  file: File;
  contents: string;
};
