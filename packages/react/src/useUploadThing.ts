import { useRef, useState } from "react";

import type { ExpandedRouteConfig } from "@uploadthing/shared";
import { UploadThingError } from "@uploadthing/shared";
import type { UploadFileResponse } from "uploadthing/client";
import { DANGEROUS__uploadFiles } from "uploadthing/client";
import type {
  FileRouter,
  inferEndpointInput,
  inferErrorShape,
} from "uploadthing/server";

import { useEvent } from "./utils/useEvent";
import useFetch from "./utils/useFetch";

type EndpointMetadata = {
  slug: string;
  config: ExpandedRouteConfig;
}[];

const useEndpointMetadata = (url: string, endpoint: string) => {
  const { data } = useFetch<EndpointMetadata>(url);
  return data?.find((x) => x.slug === endpoint);
};

export type UseUploadthingProps<TRouter extends FileRouter> = {
  onClientUploadComplete?: (res?: UploadFileResponse[]) => void;
  onUploadProgress?: (p: number) => void;
  onUploadError?: (e: UploadThingError<inferErrorShape<TRouter>>) => void;
  onUploadBegin?: (fileName: string) => void;
};

const fatalClientError = (e: Error) =>
  new UploadThingError({
    code: "INTERNAL_CLIENT_ERROR",
    message: "Something went wrong. Please report this to UploadThing.",
    cause: e,
  });

export const INTERNAL_uploadthingHookGen = <
  TRouter extends FileRouter,
>(initOpts: {
  /**
   * Absolute URL to the UploadThing API endpoint
   * @example http://localhost:3000/api/uploadthing
   */
  url: string;
}) => {
  const useUploadThing = <TEndpoint extends keyof TRouter>(
    endpoint: TEndpoint,
    opts?: UseUploadthingProps<TRouter>,
  ) => {
    const [isUploading, setUploading] = useState(false);
    const uploadProgress = useRef(0);
    const fileProgress = useRef<Map<string, number>>(new Map());

    const permittedFileInfo = useEndpointMetadata(
      initOpts.url,
      endpoint as string,
    );

    type InferredInput = inferEndpointInput<TRouter[typeof endpoint]>;
    type FuncInput = undefined extends InferredInput
      ? [files: File[], input?: undefined]
      : [files: File[], input: InferredInput];

    const startUpload = useEvent(async (...args: FuncInput) => {
      const [files, input] = args;
      setUploading(true);
      try {
        const res = await DANGEROUS__uploadFiles(
          {
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
            onUploadBegin({ file }) {
              if (!opts?.onUploadBegin) return;

              opts.onUploadBegin(file);
            },
          },
          {
            url: initOpts.url,
          },
        );

        opts?.onClientUploadComplete?.(res);
        return res;
      } catch (e) {
        const error =
          e instanceof UploadThingError ? e : fatalClientError(e as Error);
        opts?.onUploadError?.(
          error as UploadThingError<inferErrorShape<TRouter>>,
        );
      } finally {
        setUploading(false);
        fileProgress.current = new Map();
        uploadProgress.current = 0;
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

export const generateReactHelpers = <TRouter extends FileRouter>(initOpts: {
  /**
   * Absolute URL to the UploadThing API endpoint
   * @example http://localhost:3000/api/uploadthing
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
