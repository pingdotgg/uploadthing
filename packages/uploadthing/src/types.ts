import type { ExtendObjectIf, MaybePromise } from "@uploadthing/shared";

import type { FileRouter, inferEndpointInput } from "./internal/types";

export type {
  inferEndpointInput,
  inferEndpointOutput,
  inferErrorShape,
  FileRouter,
} from "./internal/types";

export * from "./sdk/types";

export type {
  EndpointMetadata,
  ExpandedRouteConfig,
} from "@uploadthing/shared";

export type {
  FileUploadData,
  FileUploadDataWithCustomId,
  UploadedFileData,
  ClientUploadedFileData,
} from "./internal/shared-schemas";

export type UploadFilesOptions<
  TRouter extends FileRouter,
  TEndpoint extends keyof TRouter,
  TSkipPolling extends boolean = false,
> = {
  /**
   * The files to upload
   */
  files: File[];
  /**
   * An AbortSignal to cancel the upload
   */
  signal?: AbortSignal | undefined;
  /**
   * Called when presigned URLs have been retrieved and the file upload is about to begin
   */
  onUploadBegin?: ((opts: { file: string }) => void) | undefined;
  /**
   * Called continuously as the file is uploaded to the storage provider
   */
  onUploadProgress?:
    | ((opts: { file: string; progress: number }) => void)
    | undefined;
  /**
   * Skip polling for server data after upload is complete
   * Useful if you want faster response times and don't need
   * any data returned from the server `onUploadComplete` callback
   * @default false
   */
  skipPolling?: TSkipPolling | undefined;
  /**
   * URL to the UploadThing API endpoint
   * @example URL { http://localhost:3000/api/uploadthing }
   * @example URL { https://www.example.com/api/uploadthing }
   * @remarks This option is not required when `uploadFiles` has been generated with `genUploader`
   */
  url: URL;
  /**
   * Set custom headers that'll get sent with requests
   * to your server
   */
  headers?: HeadersInit | (() => MaybePromise<HeadersInit>) | undefined;
  /**
   * The uploadthing package that is making this request, used to identify the client in the server logs
   * @example "@uploadthing/react"
   * @remarks This option is not required when `uploadFiles` has been generated with `genUploader`
   */
  package: string;
} & ExtendObjectIf<
  inferEndpointInput<TRouter[TEndpoint]>,
  { input: inferEndpointInput<TRouter[TEndpoint]> }
>;

export type GenerateUploaderOptions = {
  /**
   * URL to the UploadThing API endpoint
   * @example /api/uploadthing
   * @example URL { https://www.example.com/api/uploadthing }
   *
   * If relative, host will be inferred from either the `VERCEL_URL` environment variable or `window.location.origin`
   *
   * @default (VERCEL_URL ?? window.location.origin) + "/api/uploadthing"
   */
  url?: string | URL;
  /**
   * The uploadthing package that is making this request
   * @example "@uploadthing/react"
   *
   * This is used to identify the client in the server logs
   */
  package: string;
};
