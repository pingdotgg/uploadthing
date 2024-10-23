import { useRef, useState } from "react";

import type {
  EndpointMetadata,
  ExpandedRouteConfig,
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
import useFetch from "./utils/useFetch";

declare const globalThis: {
  __UPLOADTHING?: EndpointMetadata;
};

const useRouteConfig = (
  url: URL,
  endpoint: string,
): ExpandedRouteConfig | undefined => {
  const maybeServerData = globalThis.__UPLOADTHING;
  const { data } = useFetch<EndpointMetadata>(
    // Don't fetch if we already have the data
    maybeServerData ? undefined : url.href,
  );
  return (maybeServerData ?? data)?.find((x) => x.slug === endpoint)?.config;
};

/**
 * @internal - This is an internal function. Use `generateReactHelpers` instead.
 * The actual hook we export for public usage is generated from `generateReactHelpers`
 * which has the URL and FileRouter generic pre-bound.
 */
export function __useUploadThingInternal<
  TRouter extends FileRouter,
  TEndpoint extends keyof TRouter,
>(
  url: URL,
  endpoint: EndpointArg<TRouter, TEndpoint>,
  opts?: UseUploadthingProps<TRouter, TEndpoint>,
) {
  const { uploadFiles, routeRegistry } = genUploader<TRouter>({
    url,
    package: "@uploadthing/react",
  });

  const [isUploading, setUploading] = useState(false);
  const uploadProgress = useRef(0);
  const fileProgress = useRef<Map<File, number>>(new Map());

  type InferredInput = inferEndpointInput<TRouter[TEndpoint]>;
  type FuncInput = undefined extends InferredInput
    ? [files: File[], input?: undefined]
    : [files: File[], input: InferredInput];

  const startUpload = useEvent(async (...args: FuncInput) => {
    const files = (await opts?.onBeforeUploadBegin?.(args[0])) ?? args[0];
    const input = args[1];

    setUploading(true);
    files.forEach((f) => fileProgress.current.set(f, 0));
    opts?.onUploadProgress?.(0);
    try {
      const res = await uploadFiles<TEndpoint>(endpoint, {
        signal: opts?.signal,
        headers: opts?.headers,
        files,
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
      setUploading(false);
      fileProgress.current = new Map();
      uploadProgress.current = 0;
    }
  });

  const _endpoint = unwrap(endpoint, routeRegistry);
  const routeConfig = useRouteConfig(url, _endpoint as string);

  return {
    startUpload,
    isUploading,
    routeConfig,
  } as const;
}

export const generateReactHelpers = <TRouter extends FileRouter>(
  initOpts?: GenerateTypedHelpersOptions,
) => {
  warnIfInvalidPeerDependency(
    "@uploadthing/react",
    peerDependencies.uploadthing,
    uploadthingClientVersion,
  );

  const url = resolveMaybeUrlArg(initOpts?.url);

  const clientHelpers = genUploader<TRouter>({
    url,
    package: "@uploadthing/react",
  });

  function useUploadThing<TEndpoint extends keyof TRouter>(
    endpoint: EndpointArg<TRouter, TEndpoint>,
    opts?: UseUploadthingProps<TRouter, TEndpoint>,
  ) {
    return __useUploadThingInternal(url, endpoint, opts);
  }

  function getRouteConfig(slug: EndpointArg<TRouter, keyof TRouter>) {
    const maybeServerData = globalThis.__UPLOADTHING;
    const endpoint = unwrap(slug, clientHelpers.routeRegistry);
    const config = maybeServerData?.find((x) => x.slug === endpoint)?.config;
    if (!config) {
      throw new Error(
        `No config found for endpoint "${endpoint.toString()}". Please make sure to use the NextSSRPlugin in your Next.js app.`,
      );
    }
    return config;
  }

  return {
    useUploadThing,
    ...clientHelpers,
    /**
     * Get the config for a given endpoint outside of React context.
     * @remarks Can only be used if the NextSSRPlugin is used in the app.
     */
    getRouteConfig,
  } as const;
};
