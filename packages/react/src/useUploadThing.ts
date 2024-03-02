import { useRef, useState } from "react";

import type { EndpointMetadata } from "@uploadthing/shared";
import {
  INTERNAL_DO_NOT_USE__fatalClientError,
  resolveMaybeUrlArg,
  semverLite,
  UploadThingError,
} from "@uploadthing/shared";
import {
  genUploader,
  version as uploadthingClientVersion,
} from "uploadthing/client";
import type {
  FileRouter,
  inferEndpointInput,
  inferErrorShape,
} from "uploadthing/server";

import { peerDependencies } from "../package.json";
import type { GenerateTypedHelpersOptions, UseUploadthingProps } from "./types";
import { useEvent } from "./utils/useEvent";
import useFetch from "./utils/useFetch";

declare const globalThis: {
  __UPLOADTHING?: EndpointMetadata;
};

const useEndpointMetadata = (url: URL, endpoint: string) => {
  const maybeServerData = globalThis.__UPLOADTHING;
  const { data } = useFetch<EndpointMetadata>(
    // Don't fetch if we already have the data
    maybeServerData ? undefined : url.href,
  );
  return (maybeServerData ?? data)?.find((x) => x.slug === endpoint);
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
  if (!semverLite(peerDependencies.uploadthing, uploadthingClientVersion)) {
    console.error(
      `!!!WARNING::: @uploadthing/react requires "uploadthing@${peerDependencies.uploadthing}", but version "${uploadthingClientVersion}" is installed`,
    );
  }
  const uploadFiles = genUploader<TRouter>({
    url: initOpts.url,
    package: "@uploadthing/react",
  });

  const useUploadThing = <
    TEndpoint extends keyof TRouter,
    TSkipPolling extends boolean = false,
  >(
    endpoint: TEndpoint,
    opts?: UseUploadthingProps<TRouter, TEndpoint, TSkipPolling>,
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
      const files = (await opts?.onBeforeUploadBegin?.(args[0])) ?? args[0];
      const input = args[1];

      setUploading(true);
      opts?.onUploadProgress?.(0);
      try {
        const res = await uploadFiles(endpoint, {
          files,
          skipPolling: opts?.skipPolling,
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

export const generateReactHelpers = <TRouter extends FileRouter>(
  initOpts?: GenerateTypedHelpersOptions,
) => {
  const url = resolveMaybeUrlArg(initOpts?.url);

  return {
    useUploadThing: INTERNAL_uploadthingHookGen<TRouter>({ url }),
    uploadFiles: genUploader<TRouter>({
      url,
      package: "@uploadthing/react",
    }),
  } as const;
};
