import { createSignal } from "solid-js";

import { UploadThingError } from "@uploadthing/shared";
import type { ExpandedRouteConfig } from "@uploadthing/shared";
import type { UploadFileResponse } from "uploadthing/client";
import {
  DANGEROUS__uploadFiles,
  getFullApiUrl,
  INTERNAL_DO_NOT_USE__fatalClientError,
} from "uploadthing/client";
import type {
  DistributiveOmit,
  FileRouter,
  inferEndpointInput,
  inferEndpointOutput,
  inferErrorShape,
} from "uploadthing/server";
import type { MaybePromise } from "../../uploadthing/src/internal/types";

import { createFetch } from "./utils/createFetch";

type EndpointMetadata = {
  slug: string;
  config: ExpandedRouteConfig;
}[];

const createEndpointMetadata = (url: URL, endpoint: string) => {
  const dataGetter = createFetch<EndpointMetadata>(url.href);
  return () => dataGetter()?.data?.find((x) => x.slug === endpoint);
};

export type UseUploadthingProps<
  TRouter extends FileRouter,
  TEndpoint extends keyof TRouter,
> = {
  onUploadProgress?: (p: number) => void;
  onUploadBegin?: (fileName: string) => void;
  onBeforeUploadBegin?:  (files: File[]) => MaybePromise<File[]>;
  onClientUploadComplete?: (
    res: UploadFileResponse<inferEndpointOutput<TRouter[TEndpoint]>>[],
  ) => void;
  onUploadError?: (e: UploadThingError<inferErrorShape<TRouter>>) => void;
};

export const INTERNAL_uploadthingHookGen = <
  TRouter extends FileRouter,
>(initOpts: {
  /**
   * URL to the UploadThing API endpoint
   * @example URL { http://localhost:3000/api/uploadthing }
   * @example URL { https://www.example.com/api/uploadthing }
   */
  url: URL;
}) => {
  const useUploadThing = <TEndpoint extends keyof TRouter>(
    endpoint: TEndpoint,
    opts?: UseUploadthingProps<TRouter, TEndpoint>,
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
    const files = await opts?.onBeforeUploadBegin?.(args[0]) ?? args[0];
      const input = args[1];

      setUploading(true);
      opts?.onUploadProgress?.(0);
      try {
        const res = await DANGEROUS__uploadFiles<TRouter, TEndpoint>(endpoint, {
          files,
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
          url: initOpts.url,
        });

        opts?.onClientUploadComplete?.(res);
        return res;
      } catch (e) {
        let error: UploadThingError<inferErrorShape<TRouter>>;
        if (e instanceof UploadThingError) {
          error = e as UploadThingError<inferErrorShape<TRouter>>;
        } else {
          error = INTERNAL_DO_NOT_USE__fatalClientError(e as Error);
          console.error(
            "Something went wrong. Please contact UploadThing and provide the following cause:",
            error.cause instanceof Error ? error.cause.toString() : error.cause,
          );
        }
        opts?.onUploadError?.(error);
        return;
      } finally {
        setUploading(false);
        fileProgress = new Map();
        uploadProgress = 0;
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

export const generateSolidHelpers = <TRouter extends FileRouter>(initOpts?: {
  /**
   * URL to the UploadThing API endpoint
   * @example URL { /api/uploadthing }
   * @example URL { https://www.example.com/api/uploadthing }
   *
   * If relative, host will be inferred from either the `VERCEL_URL` environment variable or `window.location.origin`
   *
   * @default (VERCEL_URL ?? window.location.origin) + "/api/uploadthing"
   */
  url?: string | URL;
}) => {
  const url =
    initOpts?.url instanceof URL ? initOpts.url : getFullApiUrl(initOpts?.url);

  return {
    useUploadThing: INTERNAL_uploadthingHookGen<TRouter>({ url }),
    uploadFiles: <TEndpoint extends keyof TRouter>(
      endpoint: TEndpoint,
      opts: DistributiveOmit<
        Parameters<typeof DANGEROUS__uploadFiles<TRouter, TEndpoint>>[1],
        "url"
      >,
    ) =>
      // eslint-disable-next-line @typescript-eslint/no-unsafe-argument
      DANGEROUS__uploadFiles<TRouter, TEndpoint>(endpoint, {
        ...opts,
        url,
      } as any),
  } as const;
};

export type FullFile = {
  file: File;
  contents: string;
};
