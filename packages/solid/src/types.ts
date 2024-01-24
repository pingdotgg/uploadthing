import type { UploadThingError } from "@uploadthing/shared";
import type { UploadFileResponse } from "uploadthing/client";
import type {
  FileRouter,
  inferEndpointInput,
  inferEndpointOutput,
  inferErrorShape,
} from "uploadthing/server";

export interface GenerateTypedHelpersOptions {
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
}

export type UseUploadthingProps<
  TRouter extends FileRouter,
  TEndpoint extends keyof TRouter,
> = {
  onUploadProgress?: (p: number) => void;
  onUploadBegin?: (fileName: string) => void;
  onBeforeUploadBegin?: (files: File[]) => File[] | Promise<File[]>;
  onClientUploadComplete?: (
    res: UploadFileResponse<inferEndpointOutput<TRouter[TEndpoint]>>[],
  ) => void;
  onUploadError?: (e: UploadThingError<inferErrorShape<TRouter>>) => void;
};

export type UploadthingComponentProps<
  TRouter extends FileRouter,
  TEndpoint extends keyof TRouter,
> = UseUploadthingProps<TRouter, TEndpoint> & {
  endpoint: TEndpoint;
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

  multiple?: boolean;
} & (undefined extends inferEndpointInput<TRouter[TEndpoint]>
    ? // eslint-disable-next-line @typescript-eslint/ban-types
      {}
    : {
        input: inferEndpointInput<TRouter[TEndpoint]>;
      });
