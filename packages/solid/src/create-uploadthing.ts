import { createSignal } from "solid-js";

import type {
  EndpointMetadata,
  ExpandedRouteConfig,
  FetchEsque,
} from "@uploadthing/shared";
import {
  INTERNAL_DO_NOT_USE__fatalClientError,
  resolveMaybeUrlArg,
  roundProgress,
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
import type {
  CreateUploadthingProps,
  GenerateTypedHelpersOptions,
} from "./types";
import { createFetch } from "./utils/createFetch";

const createRouteConfig = (
  fetchFn: FetchEsque,
  url: URL,
  endpoint: string,
): (() => ExpandedRouteConfig | undefined) => {
  const dataGetter = createFetch<EndpointMetadata>(fetchFn, url.href);
  return () => dataGetter()?.data?.find((x) => x.slug === endpoint)?.config;
};

export function __createUploadThingInternal<
  TRouter extends FileRouter,
  TEndpoint extends keyof TRouter,
>(
  url: URL,
  endpoint: EndpointArg<TRouter, TEndpoint>,
  fetch: FetchEsque,
  opts?: CreateUploadthingProps<TRouter[TEndpoint]>,
) {
  const progressGranularity = opts?.uploadProgressGranularity ?? "coarse";
  const { uploadFiles, routeRegistry } = genUploader<TRouter>({
    fetch,
    url,
    package: "@uploadthing/solid",
  });

  const [isUploading, setUploading] = createSignal(false);
  let uploadProgress = 0;
  let fileProgress = new Map<File, number>();

  type InferredInput = inferEndpointInput<TRouter[TEndpoint]>;
  type FuncInput = undefined extends InferredInput
    ? [files: File[], input?: undefined]
    : [files: File[], input: InferredInput];

  const startUpload = async (...args: FuncInput) => {
    const files = (await opts?.onBeforeUploadBegin?.(args[0])) ?? args[0];
    const input = args[1];

    setUploading(true);
    opts?.onUploadProgress?.(0);
    files.forEach((f) => fileProgress.set(f, 0));
    try {
      const res = await uploadFiles<TEndpoint>(endpoint, {
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
      setUploading(false);
      fileProgress = new Map();
      uploadProgress = 0;
    }
  };

  const _endpoint = unwrap(endpoint, routeRegistry);
  const routeConfig = createRouteConfig(fetch, url, _endpoint as string);

  return {
    startUpload,
    isUploading,
    routeConfig,
  } as const;
}

export const generateSolidHelpers = <TRouter extends FileRouter>(
  initOpts?: GenerateTypedHelpersOptions,
) => {
  warnIfInvalidPeerDependency(
    "@uploadthing/solid",
    peerDependencies.uploadthing,
    uploadthingClientVersion,
  );

  const fetch = initOpts?.fetch ?? globalThis.fetch;
  const url = resolveMaybeUrlArg(initOpts?.url);

  const clientHelpers = genUploader<TRouter>({
    fetch,
    url,
    package: "@uploadthing/solid",
  });

  function createUploadThing<TEndpoint extends keyof TRouter>(
    endpoint: EndpointArg<TRouter, TEndpoint>,
    opts?: CreateUploadthingProps<TRouter[TEndpoint]>,
  ) {
    return __createUploadThingInternal(url, endpoint, fetch, opts);
  }

  return {
    createUploadThing,
    ...clientHelpers,
  } as const;
};
