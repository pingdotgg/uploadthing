import { useFetch } from "@vueuse/core";
import type { ComputedRef } from "vue";
import { computed, ref } from "vue";

import type {
  EndpointMetadata,
  ExpandedRouteConfig,
  FetchEsque,
} from "@uploadthing/shared";
import {
  INTERNAL_DO_NOT_USE__fatalClientError,
  resolveMaybeUrlArg,
  unwrap,
  UploadAbortedError,
  UploadThingError,
  warnIfInvalidPeerDependency,
} from "@uploadthing/shared";
import {
  genUploader,
  version as uploadthingClientVersion,
} from "uploadthing/client";
import type {
  EndpointArg,
  FileRouter,
  inferEndpointInput,
  inferErrorShape,
} from "uploadthing/types";

import { peerDependencies } from "../package.json";
import type { GenerateTypedHelpersOptions, UseUploadthingProps } from "./types";
import { useEvent } from "./utils/useEvent";

export type {
  EndpointMetadata,
  ExpandedRouteConfig,
} from "@uploadthing/shared";

const useRouteConfig = (
  fetch: FetchEsque,
  url: URL,
  endpoint: string,
): ComputedRef<ExpandedRouteConfig | undefined> => {
  // TODO: useState with server-inserted data to skip fetch on client
  const { data } = useFetch<string>(url.href, {
    fetch: fetch as never,
  });
  return computed(() => {
    if (!data.value) return undefined;
    const endpointData =
      typeof data.value === "string"
        ? (JSON.parse(data.value) as EndpointMetadata)
        : data.value;
    return endpointData?.find((x) => x.slug === endpoint)?.config;
  });
};

export function __useUploadThingInternal<
  TRouter extends FileRouter,
  TEndpoint extends keyof TRouter,
>(
  url: URL,
  endpoint: EndpointArg<TRouter, TEndpoint>,
  fetch: FetchEsque,
  opts?: UseUploadthingProps<TRouter[TEndpoint]>,
) {
  const { uploadFiles, routeRegistry } = genUploader<TRouter>({
    fetch,
    url,
    package: "@uploadthing/vue",
  });

  const isUploading = ref(false);
  const uploadProgress = ref(0);
  const fileProgress = ref(new Map<File, number>());

  type InferredInput = inferEndpointInput<TRouter[TEndpoint]>;
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
      if (e instanceof UploadAbortedError) throw e;

      let error: UploadThingError<inferErrorShape<TRouter[TEndpoint]>>;
      if (e instanceof UploadThingError) {
        error = e as UploadThingError<inferErrorShape<TRouter[TEndpoint]>>;
      } else {
        error = INTERNAL_DO_NOT_USE__fatalClientError(e as Error);
        // eslint-disable-next-line no-console
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

  const _endpoint = computed(() => unwrap(endpoint, routeRegistry));
  const routeConfig = useRouteConfig(fetch, url, _endpoint.value as string);

  return {
    startUpload,
    isUploading,
    routeConfig,
    /**
     * @deprecated Use `routeConfig` instead
     */
    permittedFileInfo: routeConfig
      ? { slug: _endpoint.value, config: routeConfig }
      : undefined,
  } as const;
}

export const generateVueHelpers = <TRouter extends FileRouter>(
  initOpts?: GenerateTypedHelpersOptions,
) => {
  warnIfInvalidPeerDependency(
    "@uploadthing/vue",
    peerDependencies.uploadthing,
    uploadthingClientVersion,
  );

  const fetch = initOpts?.fetch ?? globalThis.fetch;
  const url = resolveMaybeUrlArg(initOpts?.url);

  const clientHelpers = genUploader<TRouter>({
    fetch,
    url,
    package: "@uploadthing/vue",
  });

  function useUploadThing<TEndpoint extends keyof TRouter>(
    endpoint: EndpointArg<TRouter, TEndpoint>,
    opts?: UseUploadthingProps<TRouter[TEndpoint]>,
  ) {
    return __useUploadThingInternal(url, endpoint, fetch, opts);
  }

  return {
    useUploadThing,
    ...clientHelpers,
  } as const;
};
