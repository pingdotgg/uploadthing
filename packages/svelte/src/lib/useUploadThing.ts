import { derived, readonly, writable } from "svelte/store";

import type { ExpandedRouteConfig } from "@uploadthing/shared";
import { UploadThingError } from "@uploadthing/shared";
import type { UploadFileResponse } from "uploadthing/client";
import { DANGEROUS__uploadFiles } from "uploadthing/client";
import type {
  ErrorMessage,
  FileRouter,
  inferEndpointInput,
  inferErrorShape,
} from "uploadthing/server";

import { createUploader } from "./component";
import type { UploadthingComponentProps } from "./component/shared";
import { createFetch } from "./utils/createFetch";

type EndpointMetadata = {
  slug: string;
  config: ExpandedRouteConfig;
}[];

const createEndpointMetadata = (endpoint: string) => {
  const dataGetter = createFetch<EndpointMetadata>(`/api/uploadthing`);
  return derived(dataGetter, ($data) =>
    $data.data?.find((x) => x.slug === endpoint),
  );
};

export type UseUploadthingProps<TRouter extends FileRouter> = {
  onClientUploadComplete?: (res?: UploadFileResponse[]) => void;
  onUploadProgress?: (p: number) => void;
  onUploadError?: (e: UploadThingError<inferErrorShape<TRouter>>) => void;
  onUploadBegin?: (fileName: string) => void;
};

const fatalClientError = (e: Error) =>
  new UploadThingError({
    code: "INTERNAL_CLIENT_ERROR",
    message: "Something went wrong. Please report this to UploadThing.",
    cause: e,
  });

export const INTERNAL_uploadthingHookGen = <TRouter extends FileRouter>() => {
  const useUploadThing = <TEndpoint extends keyof TRouter>(
    endpoint: TEndpoint,
    opts?: UseUploadthingProps<TRouter>,
  ) => {
    const isUploading = writable(false);
    const permittedFileInfo = createEndpointMetadata(endpoint as string);
    let uploadProgress = 0;
    let fileProgress = new Map();

    type InferredInput = inferEndpointInput<TRouter[typeof endpoint]>;
    type FuncInput = undefined extends InferredInput
      ? [files: File[], input?: undefined]
      : [files: File[], input: InferredInput];

    const startUpload = async (...args: FuncInput) => {
      const [files, input] = args;
      isUploading.set(true);
      try {
        const res = await DANGEROUS__uploadFiles({
          files,
          endpoint: endpoint as string,
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
        });
        opts?.onClientUploadComplete?.(res);
        return res;
      } catch (e) {
        const error = e instanceof UploadThingError ? e : fatalClientError;
        opts?.onUploadError?.(
          error as UploadThingError<inferErrorShape<TRouter>>,
        );
      } finally {
        isUploading.set(false);
        fileProgress = new Map();
        uploadProgress = 0;
      }
    };
    return {
      startUpload,
      isUploading: readonly(isUploading),
      permittedFileInfo,
    } as const;
  };
  return useUploadThing;
};

const generateUploader = <TRouter extends FileRouter>() => {
  return (
    props: FileRouter extends TRouter
      ? ErrorMessage<"You forgot to pass the generic">
      : UploadthingComponentProps<TRouter>,
  ) => createUploader<TRouter>(props);
};

export const generateSvelteHelpers = <TRouter extends FileRouter>() => {
  return {
    useUploadThing: INTERNAL_uploadthingHookGen<TRouter>(),
    uploadFiles: DANGEROUS__uploadFiles<TRouter>,
    createUploader: generateUploader<TRouter>(),
  } as const;
};

export type FullFile = {
  file: File;
  contents: string;
};
