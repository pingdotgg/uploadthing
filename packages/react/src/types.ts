import type { ExtendObjectIf, UploadThingError } from "@uploadthing/shared";
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
  TSkipPolling extends boolean = false,
  TServerOutput = false extends TSkipPolling
    ? inferEndpointOutput<TRouter[TEndpoint]>
    : null,
> = {
  /**
   * Called when the upload is submitted and the server is about to be queried for presigned URLs
   * Can be used to modify the files before they are uploaded, e.g. renaming them
   */
  onBeforeUploadBegin?: (files: File[]) => Promise<File[]> | File[];
  /**
   * Called when presigned URLs have been retrieved and the file upload is about to begin
   */
  onUploadBegin?: (fileName: string) => void;
  /**
   * Called continuously as the file is uploaded to the storage provider
   */
  onUploadProgress?: (p: number) => void;
  /**
   * Skip polling for server data after upload is complete
   * Useful if you want faster response times and don't need
   * any data returned from the server `onUploadComplete` callback
   * @default false
   */
  skipPolling?: TSkipPolling;
  /**
   * Called when the file uploads are completed
   * - If `skipPolling` is `true`, this will be called once
   *   all the files are uploaded to the storage provider.
   * - If `skipPolling` is `false`, this will be called after
   *   the serverside `onUploadComplete` callback has finished
   */
  onClientUploadComplete?: (res: UploadFileResponse<TServerOutput>[]) => void;
  /**
   * Called if the upload fails
   */
  onUploadError?: (e: UploadThingError<inferErrorShape<TRouter>>) => void;
};

export type UploadthingComponentProps<
  TRouter extends FileRouter,
  TEndpoint extends keyof TRouter,
  TSkipPolling extends boolean = false,
> = UseUploadthingProps<TRouter, TEndpoint, TSkipPolling> & {
  /**
   * The endpoint from your FileRouter to use for the upload
   */
  endpoint: TEndpoint;
  /**
   * URL to the UploadThing API endpoint
   * @example URL { /api/uploadthing }
   * @example URL { https://www.example.com/api/uploadthing }
   *
   * If relative, host will be inferred from either the `VERCEL_URL` environment variable or `window.location.origin`
   *
   * @default (VERCEL_URL ?? window.location.origin) + "/api/uploadthing"
   */
  url?: string | URL;
  config?: {
    mode?: "auto" | "manual";
    appendOnPaste?: boolean;
  };
} & ExtendObjectIf<
    inferEndpointInput<TRouter[TEndpoint]>,
    {
      /**
       * The input to the endpoint, as defined using `.input()` on the FileRouter endpoint
       * @see https://docs.uploadthing.com/api-reference/server#input
       */
      input: inferEndpointInput<TRouter[TEndpoint]>;
    }
  >;
