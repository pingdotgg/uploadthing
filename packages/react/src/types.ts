import type {
  ClassListMerger,
  ErrorMessage,
  ExtendObjectIf,
  FetchEsque,
  MaybePromise,
  ProgressGranularity,
  UploadThingError,
} from "@uploadthing/shared";
import type {
  AnyFileRoute,
  ClientUploadedFileData,
  EndpointArg,
  FileRouter,
  inferEndpointInput,
  inferEndpointOutput,
  inferErrorShape,
} from "uploadthing/types";

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
  /**
   * Provide a custom fetch implementation.
   * @default `globalThis.fetch`
   * @example
   * ```ts
   * fetch: (input, init) => {
   *   if (input.toString().startsWith(MY_SERVER_URL)) {
   *     // Include cookies in the request to your API
   *     return fetch(input, {
   *       ...init,
   *       credentials: "include",
   *     });
   *   }
   *
   *   return fetch(input, init);
   * }
   * ```
   */
  fetch?: FetchEsque | undefined;
}

export type UseUploadthingProps<
  TFileRoute extends AnyFileRoute,
  TServerOutput = inferEndpointOutput<TFileRoute>,
> = {
  /**
   * Called when the upload is submitted and the server is about to be queried for presigned URLs
   * Can be used to modify the files before they are uploaded, e.g. renaming them
   */
  onBeforeUploadBegin?:
    | ((files: File[]) => Promise<File[]> | File[])
    | undefined;
  /**
   * Called when presigned URLs have been retrieved and the file upload is about to begin
   */
  onUploadBegin?: ((fileName: string) => void) | undefined;
  /**
   * Control how granular the upload progress is reported
   * - "all" - No filtering is applied, all progress events are reported
   * - "fine" - Progress is reported in increments of 1%
   * - "coarse" - Progress is reported in increments of 10%
   * @default "coarse"
   */
  uploadProgressGranularity?: ProgressGranularity | undefined;
  /**
   * Called continuously as the file is uploaded to the storage provider
   */
  onUploadProgress?: ((p: number) => void) | undefined;
  /**
   * This option has been moved to your serverside route config.
   * Please opt-in by setting `awaitServerData: false` in your route
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
   * Called when the file uploads are completed
   * @remarks If `RouteOptions.awaitServerData` is `true`, this will be
   * called after the serverside `onUploadComplete` callback has finished
   */
  onClientUploadComplete?:
    | ((res: ClientUploadedFileData<TServerOutput>[]) => MaybePromise<void>)
    | undefined;
  /**
   * Called if the upload fails
   */
  onUploadError?:
    | ((e: UploadThingError<inferErrorShape<TFileRoute>>) => MaybePromise<void>)
    | undefined;
  /**
   * Set custom headers that'll get sent with requests
   * to your server
   */
  headers?: HeadersInit | (() => MaybePromise<HeadersInit>) | undefined;
  /**
   * An AbortSignal to cancel the upload
   * Calling `abort()` on the parent AbortController will cause the
   * upload to throw an `UploadAbortedError`. In a future version
   * the function will not throw in favor of an `onUploadAborted` callback.
   */
  signal?: AbortSignal | undefined;
};

export type UploadthingComponentProps<
  TRouter extends FileRouter,
  TEndpoint extends keyof TRouter,
> = Omit<
  UseUploadthingProps<TRouter[TEndpoint]>,
  /**
   * Signal is omitted, component has its own AbortController
   * If you need to control the interruption with more granularity,
   * create your own component and pass your own signal to
   * `useUploadThing`
   * @see https://github.com/pingdotgg/uploadthing/pull/838#discussion_r1624189818
   */
  "signal"
> & {
  /**
   * Called when the upload is aborted
   */
  onUploadAborted?: (() => MaybePromise<void>) | undefined;
  /**
   * The endpoint from your FileRouter to use for the upload
   */
  endpoint: EndpointArg<TRouter, TEndpoint>;
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
  /**
   * Provide a custom fetch implementation.
   * @default `globalThis.fetch`
   * @example
   * ```ts
   * fetch: (input, init) => {
   *   if (input.toString().startsWith(MY_SERVER_URL)) {
   *     // Include cookies in the request to your API
   *     return fetch(input, {
   *       ...init,
   *       credentials: "include",
   *     });
   *   }
   *
   *   return fetch(input, init);
   * }
   * ```
   */
  fetch?: FetchEsque | undefined;
  config?: {
    mode?: "auto" | "manual";
    appendOnPaste?: boolean;
    /**
     * Override the default class name merger, with e.g. tailwind-merge
     * This may be required if you're customizing the component
     * appearance with additional TailwindCSS classes to ensure
     * classes are sorted and applied in the correct order
     */
    cn?: ClassListMerger;
  };
  disabled?: boolean;
  /**
   * Callback called when files are selected
   *
   * @param acceptedFiles - The files that were accepted.
   */
  onFilesChange?: (_: File[]) => void;
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
