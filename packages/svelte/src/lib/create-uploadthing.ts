import { derived, readonly, writable } from "svelte/store";

import type { EndpointMetadata } from "@uploadthing/shared";
import {
  INTERNAL_DO_NOT_USE__fatalClientError,
  resolveMaybeUrlArg,
  UploadThingError,
} from "@uploadthing/shared";
import { genUploader } from "uploadthing/client";
import type { FileRouter } from "uploadthing/server";
import type { inferEndpointInput, inferErrorShape } from "uploadthing/types";

import type {
  GenerateTypedHelpersOptions,
  UploadthingComponentProps,
  UseUploadthingProps,
} from "./types";
import { createFetch } from "./utils/createFetch";

export type { ExpandedRouteConfig } from "@uploadthing/shared";

const createRouteConfig = (url: URL, endpoint: string) => {
  const dataGetter = createFetch<EndpointMetadata>(url.href);
  return derived(
    dataGetter,
    ($data) => $data.data?.find((x) => x.slug === endpoint)?.config,
  );
};

export const INTERNAL_createUploadThingGen = <
  TRouter extends FileRouter,
>(initOpts: {
  /**
   * URL to the UploadThing API endpoint
   * @example URL { http://localhost:3000/api/uploadthing }
   * @example URL { https://www.example.com/api/uploadthing }
   */
  url: URL;
}) => {
  const uploadFiles = genUploader<TRouter>({
    url: initOpts.url,
    package: "@uploadthing/svelte",
  });
  const useUploadThing = <
    TEndpoint extends keyof TRouter,
    TSkipPolling extends boolean = false,
  >(
    endpoint: TEndpoint,
    opts?: UseUploadthingProps<TRouter, TEndpoint, TSkipPolling>,
  ) => {
    const isUploading = writable(false);
    const routeConfig = createRouteConfig(initOpts.url, endpoint as string);
    let uploadProgress = 0;
    let fileProgress = new Map();

    type InferredInput = inferEndpointInput<TRouter[typeof endpoint]>;
    type FuncInput = undefined extends InferredInput
      ? [files: File[], input?: undefined]
      : [files: File[], input: InferredInput];

    const startUpload = async (...args: FuncInput) => {
      const files = (await opts?.onBeforeUploadBegin?.(args[0])) ?? args[0];
      const input = args[1];
      isUploading.set(true);
      opts?.onUploadProgress?.(0);
      files.forEach((f) => fileProgress.set(f.name, 0));
      try {
        const res = await uploadFiles(endpoint, {
          files,
          skipPolling: opts?.skipPolling,
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
          // @ts-expect-error - input may not be defined on the type
          input,
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
      } finally {
        isUploading.set(false);
        fileProgress = new Map();
        uploadProgress = 0;
      }
    };
    return {
      startUpload,
      isUploading: readonly(isUploading),
      routeConfig,
    } as const;
  };
  return useUploadThing;
};

const generateUploader = <TRouter extends FileRouter>() => {
  return <
    TEndpoint extends keyof TRouter,
    TSkipPolling extends boolean = false,
  >(
    endpoint: TEndpoint,
    props: Omit<
      UploadthingComponentProps<TRouter, TEndpoint, TSkipPolling>,
      "endpoint"
    >,
  ) => ({ endpoint, ...props });
};

export const generateSvelteHelpers = <TRouter extends FileRouter>(
  initOpts?: GenerateTypedHelpersOptions,
) => {
  const url = resolveMaybeUrlArg(initOpts?.url);

  return {
    createUploadThing: INTERNAL_createUploadThingGen<TRouter>({ url }),
    uploadFiles: genUploader<TRouter>({
      url,
      package: "@uploadthing/svelte",
    }),
    createUploader: generateUploader<TRouter>(),
  } as const;
};
