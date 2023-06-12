import { useState } from "react";

import type { ExpandedRouteConfig } from "@uploadthing/shared";
import { DANGEROUS__uploadFiles } from "uploadthing/client";
import type { FileRouter, inferEndpointInput } from "uploadthing/server";

import { useEvent } from "./utils/useEvent";
import useFetch from "./utils/useFetch";

type EndpointMetadata = {
  slug: string;
  config: ExpandedRouteConfig;
}[];

const useEndpointMetadata = (endpoint: string) => {
  const { data } = useFetch<EndpointMetadata>("/api/uploadthing");
  return data?.find((x) => x.slug === endpoint);
};

export type UseUploadthingProps<TRouter extends FileRouter> = {
  [TEndpoint in keyof TRouter]: {
    endpoint: TEndpoint;
    // @internal - used to get the input type in startUpload
    $input?: inferEndpointInput<TRouter, TEndpoint>;

    onClientUploadComplete?: (
      res?: Awaited<ReturnType<typeof DANGEROUS__uploadFiles>>,
    ) => void;
    onUploadError?: (e: Error) => void;
  };
}[keyof TRouter];

export const useUploadThing = <TRouter extends FileRouter>(
  opts: UseUploadthingProps<TRouter>,
) => {
  const [isUploading, setUploading] = useState(false);

  const permittedFileInfo = useEndpointMetadata(opts.endpoint as string);

  const startUpload = useEvent(
    async (files: File[], input: typeof opts.$input) => {
      setUploading(true);
      try {
        const res = await DANGEROUS__uploadFiles({
          files,
          endpoint: opts.endpoint as string,
          input,
        });
        setUploading(false);
        opts.onClientUploadComplete?.(res);
        return res;
      } catch (e) {
        setUploading(false);
        opts.onUploadError?.(e as Error);
        return;
      }
    },
  );
  return {
    startUpload,
    isUploading,
    permittedFileInfo,
  } as const;
};

export const generateReactHelpers = <TRouter extends FileRouter>() => {
  return {
    useUploadThing: useUploadThing<TRouter>,
    uploadFiles: DANGEROUS__uploadFiles<TRouter>,
  } as const;
};

export type FullFile = {
  file: File;
  contents: string;
};
