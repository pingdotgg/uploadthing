import { useFetch } from "@vueuse/core";
import { computed, ref } from "vue";

import type { ExpandedRouteConfig } from "@uploadthing/shared";
import { DANGEROUS__uploadFiles } from "uploadthing/client";
import type { FileRouter, inferEndpointInput, inferErrorShape } from "uploadthing/server";
import { UploadThingError } from "@uploadthing/shared";
import { useEvent } from "./utils/useEvent";

type EndpointMetadata = {
  slug: string;
  config: ExpandedRouteConfig;
};

const useEndpointMetadata = () => {
  const { data } = useFetch<string>("/api/uploadthing");
  return { data };
};

export type UseUploadthingProps<TRouter extends FileRouter> = {
  onClientUploadComplete?: (
    res?: Awaited<ReturnType<typeof DANGEROUS__uploadFiles>>,
  ) => void;
  onUploadProgress?: (p: number) => void;
  onUploadError?: (e: UploadThingError<inferErrorShape<TRouter>>) => void;
};

const fatalClientError = new UploadThingError({
  code: "INTERNAL_CLIENT_ERROR",
  message: "Something went wrong. Please report this to UploadThing.",
});

export const INTERNAL_uploadthingHookGen = <TRouter extends FileRouter>() => {
  const useUploadThing = <TEndpoint extends keyof TRouter>(
    endpoint: TEndpoint,
    opts?: UseUploadthingProps<TRouter>,
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
      const [files, input] = args;
      isUploading.value = true;
      try {
        const res = await DANGEROUS__uploadFiles({
          files,
          endpoint: endpoint as string,
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
        });

        opts?.onClientUploadComplete?.(res);
        return res;
      } catch (e) {
        const error = e instanceof UploadThingError ? e : fatalClientError;
        opts?.onUploadError?.(
          error as UploadThingError<inferErrorShape<TRouter>>,
        );
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

export const generateVueHelpers = <TRouter extends FileRouter>() => {
  return {
    useUploadThing: INTERNAL_uploadthingHookGen<TRouter>(),
    uploadFiles: DANGEROUS__uploadFiles<TRouter>,
  };
};
