import { useFetch } from "@vueuse/core";
import { computed, ref } from "vue";

import type { EndpointMetadata } from "@uploadthing/shared";
import {
  INTERNAL_DO_NOT_USE__fatalClientError,
  resolveMaybeUrlArg,
  UploadAbortedError,
  UploadThingError,
} from "@uploadthing/shared";
import { genUploader } from "uploadthing/client";
import type {
  FileRouter,
  inferEndpointInput,
  inferErrorShape,
} from "uploadthing/types";

import type { GenerateTypedHelpersOptions, UseUploadthingProps } from "./types";
import { useEvent } from "./utils/useEvent";

export type {
  EndpointMetadata,
  ExpandedRouteConfig,
} from "@uploadthing/shared";

const useRouteConfig = (url: URL, endpoint: string) => {
  // TODO: useState with server-inserted data to skip fetch on client
  const { data } = useFetch<string>(url.href);
  return computed(() => {
    if (!data.value) return undefined;
    const endpointData =
      typeof data.value === "string"
        ? (JSON.parse(data.value) as EndpointMetadata)
        : (data.value as EndpointMetadata);
    return endpointData?.find((x) => x.slug === endpoint)?.config;
  });
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
  const { uploadFiles } = genUploader<TRouter>({
    url: initOpts.url,
    package: "@uploadthing/vue",
  });

  const useUploadThing = <TEndpoint extends keyof TRouter>(
    endpoint: TEndpoint,
    opts?: UseUploadthingProps<TRouter, TEndpoint>,
  ) => {
    const isUploading = ref(false);
    const uploadProgress = ref(0);
    const fileProgress = ref(new Map<File, number>());

    type InferredInput = inferEndpointInput<TRouter[typeof endpoint]>;
    type FuncInput = undefined extends InferredInput
      ? [files: File[], input?: undefined]
      : [files: File[], input: InferredInput];

    const startUpload = useEvent(async (...args: FuncInput) => {
      const files = (await opts?.onBeforeUploadBegin?.(args[0])) ?? args[0];
      const input = args[1];

      isUploading.value = true;
      opts?.onUploadProgress?.(0);
      files.forEach((f) => fileProgress.value.set(f, 0));
      try {
        const res = await uploadFiles(endpoint, {
          signal: opts?.signal,
          headers: opts?.headers,
          files,
          onUploadProgress: (progress) => {
            if (!opts?.onUploadProgress) return;
            fileProgress.value.set(progress.file, progress.progress);
            let sum = 0;
            fileProgress.value.forEach((p) => {
              sum += p;
            });
            const averageProgress =
              Math.floor(sum / fileProgress.value.size / 10) * 10;
            if (averageProgress !== uploadProgress.value) {
              opts.onUploadProgress(averageProgress);
              uploadProgress.value = averageProgress;
            }
          },
          onUploadBegin({ file }) {
            if (!opts?.onUploadBegin) return;

            opts.onUploadBegin(file);
          },
          // @ts-expect-error - input may not be defined on the type
          input,
        });

        await opts?.onClientUploadComplete?.(res);
        return res;
      } catch (e) {
        /**
         * This is the only way to introduce this as a non-breaking change
         * TODO: Consider refactoring API in the next major version
         */
        if (e instanceof UploadAbortedError) throw e;

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
        await opts?.onUploadError?.(error);
      } finally {
        isUploading.value = false;
        fileProgress.value = new Map();
        uploadProgress.value = 0;
      }
    });

    const routeConfig = useRouteConfig(initOpts.url, endpoint as string);

    return {
      startUpload,
      isUploading,
      routeConfig,
      /**
       * @deprecated Use `routeConfig` instead
       */
      permittedFileInfo: routeConfig
        ? { slug: endpoint, config: routeConfig }
        : undefined,
    } as const;
  };

  return useUploadThing;
};

export const generateVueHelpers = <TRouter extends FileRouter>(
  initOpts?: GenerateTypedHelpersOptions,
) => {
  const url = resolveMaybeUrlArg(initOpts?.url);

  return {
    useUploadThing: INTERNAL_uploadthingHookGen<TRouter>({ url }),
    ...genUploader<TRouter>({
      url,
      package: "@uploadthing/vue",
    }),
  };
};
