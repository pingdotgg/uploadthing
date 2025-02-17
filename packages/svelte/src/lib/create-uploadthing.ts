import { derived, readonly, writable } from "svelte/store";

import type { EndpointMetadata, FetchEsque } from "@uploadthing/shared";
import {
  INTERNAL_DO_NOT_USE__fatalClientError,
  resolveMaybeUrlArg,
  roundProgress,
  unwrap,
  UploadAbortedError,
  UploadThingError,
} from "@uploadthing/shared";
import { genUploader } from "uploadthing/client";
import type { FileRouter } from "uploadthing/server";
import type {
  EndpointArg,
  inferEndpointInput,
  inferErrorShape,
} from "uploadthing/types";

import type {
  GenerateTypedHelpersOptions,
  UploadthingComponentProps,
  UseUploadthingProps,
} from "./types";
import { createFetch } from "./utils/createFetch";

const createRouteConfig = (fetch: FetchEsque, url: URL, endpoint: string) => {
  const dataGetter = createFetch<EndpointMetadata>(fetch, url.href);
  return derived(
    dataGetter,
    ($data) => $data.data?.find((x) => x.slug === endpoint)?.config,
  );
};

export function __createUploadThingInternal<
  TRouter extends FileRouter,
  TEndpoint extends keyof TRouter,
>(
  url: URL,
  endpoint: EndpointArg<TRouter, TEndpoint>,
  fetch: FetchEsque,
  opts?: UseUploadthingProps<TRouter[TEndpoint]>,
) {
  const progressGranularity = opts?.uploadProgressGranularity ?? "coarse";
  const { uploadFiles, routeRegistry } = genUploader<TRouter>({
    fetch,
    url,
    package: "@uploadthing/svelte",
  });

  const isUploading = writable(false);
  let uploadProgress = 0;
  let fileProgress = new Map<File, number>();

  type InferredInput = inferEndpointInput<TRouter[TEndpoint]>;
  type FuncInput = undefined extends InferredInput
    ? [files: File[], input?: undefined]
    : [files: File[], input: InferredInput];

  const startUpload = async (...args: FuncInput) => {
    const files = (await opts?.onBeforeUploadBegin?.(args[0])) ?? args[0];
    const input = args[1];

    isUploading.set(true);
    opts?.onUploadProgress?.(0);
    files.forEach((f) => fileProgress.set(f, 0));
    try {
      const res = await uploadFiles(endpoint, {
        signal: opts?.signal,
        headers: opts?.headers,
        files,
        onUploadProgress: (progress) => {
          if (!opts?.onUploadProgress) return;
          fileProgress.set(progress.file, progress.progress);
          let sum = 0;
          fileProgress.forEach((p) => {
            sum += p;
          });
          const averageProgress = roundProgress(
            Math.min(100, sum / fileProgress.size),
            progressGranularity,
          );
          if (averageProgress !== uploadProgress) {
            opts.onUploadProgress(averageProgress);
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

      await opts?.onClientUploadComplete?.(res);
      return res;
    } catch (e) {
      /**
       * This is the only way to introduce this as a non-breaking change
       * TODO: Consider refactoring API in the next major version
       */
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
      isUploading.set(false);
      fileProgress = new Map();
      uploadProgress = 0;
    }
  };

  const _endpoint = unwrap(endpoint, routeRegistry);
  const routeConfig = createRouteConfig(fetch, url, _endpoint as string);

  return {
    startUpload,
    isUploading: readonly(isUploading),
    routeConfig,
    /**
     * @deprecated Use `routeConfig` instead
     */
    permittedFileInfo: { slug: _endpoint, config: readonly(routeConfig) },
  } as const;
}

const generateUploader = <TRouter extends FileRouter>() => {
  return <TEndpoint extends keyof TRouter>(
    endpoint: EndpointArg<TRouter, TEndpoint>,
    props: Omit<UploadthingComponentProps<TRouter, TEndpoint>, "endpoint">,
  ) => ({ endpoint, ...props });
};

export const generateSvelteHelpers = <TRouter extends FileRouter>(
  initOpts?: GenerateTypedHelpersOptions,
) => {
  const url = resolveMaybeUrlArg(initOpts?.url);
  const fetch = initOpts?.fetch ?? globalThis.fetch;

  const clientHelpers = genUploader<TRouter>({
    fetch,
    url,
    package: "@uploadthing/svelte",
  });

  const createUploadThing = <TEndpoint extends keyof TRouter>(
    endpoint: EndpointArg<TRouter, TEndpoint>,
    props: UploadthingComponentProps<TRouter, TEndpoint>,
  ) => {
    return __createUploadThingInternal(url, endpoint, fetch, props);
  };

  const createUploader = generateUploader<TRouter>();

  return {
    createUploadThing,
    createUploader,
    ...clientHelpers,
  } as const;
};
