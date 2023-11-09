import { useFetch } from "@vueuse/core";
import { computed, ref } from "vue";

import type { ExpandedRouteConfig } from "@uploadthing/shared";
import { UploadThingError } from "@uploadthing/shared";
import {
  DANGEROUS__uploadFiles,
  getFullApiUrl,
  INTERNAL_DO_NOT_USE__fatalClientError,
  UploadFileResponse,
} from "uploadthing/client";
import type {
  DistributiveOmit,
  FileRouter,
  inferEndpointInput,
  inferEndpointOutput,
  inferErrorShape,
} from "uploadthing/server";

import { useEvent } from "./utils/useEvent";

type EndpointMetadata = {
  slug: string;
  config: ExpandedRouteConfig;
};

const useEndpointMetadata = () => {
  const { data } = useFetch<string>("/api/uploadthing");
  return { data };
};

export type UseUploadthingProps<
  TRouter extends FileRouter,
  TEndpoint extends keyof TRouter,
> = {
  onClientUploadComplete?: (
    res: UploadFileResponse<inferEndpointOutput<TRouter[TEndpoint]>>[],
  ) => void;
  onUploadProgress?: (p: number) => void;
  onUploadError?: (e: UploadThingError<inferErrorShape<TRouter>>) => void;
  onUploadBegin?: (fileName: string) => void;
  onBeforeUploadBegin?: (files: File[]) => File[];
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
    const isUploading = ref(false);
    const uploadProgress = ref(0);
    const fileProgress = ref(new Map<string, number>());

    const { data } = useEndpointMetadata();

    const permittedFileInfo = computed(() => {
      if (!data.value) return {} as EndpointMetadata;

      return (JSON.parse(data.value) as EndpointMetadata[]).find(
        (e) => e.slug === endpoint,
      );
    });

    type InferredInput = inferEndpointInput<TRouter[typeof endpoint]>;
    type FuncInput = undefined extends InferredInput
      ? [files: File[], input?: undefined]
      : [files: File[], input: InferredInput];

    const startUpload = useEvent(async (...args: FuncInput) => {
      const files = opts?.onBeforeUploadBegin?.(args[0]) ?? args[0];
      const input = args[1];

      isUploading.value = true;
      try {
        const res = await DANGEROUS__uploadFiles<TRouter, TEndpoint>(endpoint, {
          files,
          input,
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
      } finally {
        isUploading.value = false;
        fileProgress.value = new Map<string, number>();
        uploadProgress.value = 0;
      }
    });

    return {
      startUpload,
      isUploading,
      permittedFileInfo,
    };
  };

  return useUploadThing;
};

export const generateVueHelpers = <TRouter extends FileRouter>(initOpts?: {
  /**
   * URL to the UploadThing API endpoint
   * @example "/api/uploadthing"
   * @example "https://www.example.com/api/uploadthing"
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
  };
};
