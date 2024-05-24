import type {
  ErrorMessage,
  ExtendObjectIf,
  MaybePromise,
} from "@uploadthing/shared";

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
> = {
  /**
   * The files to upload
   */
  files: File[];
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
   * This option has been moved to your serverside route config.
   * Please opt-in by setting `awaitServerData: true` in your route
   * config instead.
   * ### Example
   * ```ts
   * f(
   *   { image: { maxFileSize: "1MB" } },
   *   { awaitServerData: false }
   * ).middleware(...)
   * ```
   * @deprecated
   * @see https://docs.uploadthing.com/api-reference/server#route-options
   */
  skipPolling?: ErrorMessage<"This option has been moved to your serverside route config. Please use `awaitServerData` in your route config instead.">;
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
