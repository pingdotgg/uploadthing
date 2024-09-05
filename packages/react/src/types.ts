import type {
  ExtendObjectIf,
  FileWithState,
  MaybePromise,
  UploadThingError,
} from "@uploadthing/shared";
import type {
  ClientUploadedFileData,
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
   * Controllable state for the files to upload
   */
  files?: FileWithState[] | undefined;
  /**
   * Called when the files are changed
   */
  onFilesChange?: ((files: FileWithState[]) => void) | undefined;
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
   * Called continuously as the file is uploaded to the storage provider
   */
  onUploadProgress?:
    | ((
        /**
         * The overall progress of the upload
         */
        p: number,
        /**
         * The event that triggered the progress update
         * with the filename and that file's progress
         */
        e: { file: string; progress: number } | undefined,
      ) => void)
    | undefined;
  /**
   * Skip polling for server data after upload is complete
   * Useful if you want faster response times and don't need
   * any data returned from the server `onUploadComplete` callback
   * @default false
   */
  skipPolling?: TSkipPolling | undefined;
  /**
   * Called when the file uploads are completed
   * - If `skipPolling` is `true`, this will be called once
   *   all the files are uploaded to the storage provider.
   * - If `skipPolling` is `false`, this will be called after
   *   the serverside `onUploadComplete` callback has finished
   */
  onClientUploadComplete?:
    | ((res: ClientUploadedFileData<TServerOutput>[]) => MaybePromise<void>)
    | undefined;
  /**
   * Called if the upload fails
   */
  onUploadError?:
    | ((e: UploadThingError<inferErrorShape<TRouter>>) => MaybePromise<void>)
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
  TSkipPolling extends boolean = false,
> = Omit<
  UseUploadthingProps<TRouter, TEndpoint, TSkipPolling>,
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
