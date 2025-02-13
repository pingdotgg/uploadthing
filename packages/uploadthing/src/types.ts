import type * as LogLevel from "effect/LogLevel";

import type {
  ErrorMessage,
  ExtendObjectIf,
  FetchEsque,
  MaybePromise,
} from "@uploadthing/shared";

import type { LogFormat } from "./_internal/logger";
import type { AnyFileRoute, FileRoute } from "./_internal/types";

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
  NewPresignedUrl,
} from "./_internal/shared-schemas";
export { UploadThingToken } from "./_internal/shared-schemas";

export type { FileRoute, AnyFileRoute };
export type FileRouter = Record<string, AnyFileRoute>;

export type inferEndpointInput<TFileRoute extends AnyFileRoute> =
  TFileRoute["$types"]["input"];

export type inferEndpointOutput<TFileRoute extends AnyFileRoute> =
  TFileRoute["$types"]["output"];

export type inferErrorShape<TFileRoute extends AnyFileRoute> =
  TFileRoute["$types"]["errorShape"];

export type RouteHandlerConfig = {
  logLevel?: LogLevel.Literal;
  /**
   * What format log entries should be in
   * @default "pretty" in development, else "json"
   * @see https://effect.website/docs/guides/observability/logging#built-in-loggers
   */
  logFormat?: LogFormat;
  /**
   * The full, absolute URL to where your route handler is hosted. UploadThing
   * attempts to automatically detect this value based on the request URL and
   * headers. You can override this if the automatic detection fails.
   * @example URL { https://www.example.com/api/uploadthing }
   */
  callbackUrl?: string;
  token?: string;
  /**
   * Used to determine whether to run dev hook or not
   * @default `env.NODE_ENV === "development" || env.NODE_ENV === "dev"`
   */
  isDev?: boolean;
  /**
   * Used to override the fetch implementation
   * @default `globalThis.fetch`
   */
  fetch?: FetchEsque;
  /**
   * Set how UploadThing should handle the daemon promise before returning a response to the client.
   * You can also provide a synchronous function that will be called before returning a response to
   * the client. This can be useful for things like:
   * -  [`@vercel/functions.waitUntil`](https://vercel.com/docs/functions/functions-api-reference#waituntil)
   * - [`next/after`](https://nextjs.org/blog/next-15-rc#executing-code-after-a-response-with-nextafter-experimental)
   * - or equivalent function from your serverless infrastructure provider that allows asynchronous streaming
   * If deployed on a stateful server, you most likely want "void" to run the daemon in the background.
   * @remarks - `"await"` is not allowed in development environments
   * @default isDev === true ? "void" : "await"
   */
  handleDaemonPromise?:
    | "void"
    | "await"
    | ((promise: Promise<unknown>) => void);
  /**
   * URL override for the ingest server
   */
  ingestUrl?: string;
};

export type RouteHandlerOptions<TRouter extends FileRouter> = {
  router: TRouter;
  config?: RouteHandlerConfig;
};

export type UploadFilesOptions<TFileRoute extends AnyFileRoute> = {
  /**
   * The files to upload
   */
  files: File[];
  /**
   * An AbortSignal to cancel the upload
   * Calling `abort()` on the parent AbortController will
   * cause this function to throw an `UploadAbortedError`
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
    | ((opts: {
        /** The file that triggered the progress event */
        file: File;
        /** Percentage of the file that has been uploaded */
        progress: number;
        /** Total bytes of the file that has been uploaded */
        loaded: number;
        /** How many bytes have been uploaded since the last progress event for this file */
        delta: number;
        /** Total bytes uploaded for all files in this upload */
        totalLoaded: number;
        /** Percentage of the total loaded bytes for the upload */
        totalProgress: number;
      }) => void)
    | undefined;
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
  inferEndpointInput<TFileRoute>,
  { input: inferEndpointInput<TFileRoute> }
>;

export type CreateUploadOptions<TFileRoute extends AnyFileRoute> = {
  /**
   * The files to upload
   */
  files: File[];
  /**
   * Called continuously as the file is uploaded to the storage provider
   */
  onUploadProgress?:
    | ((opts: {
        /** The file that triggered the progress event */
        file: File;
        /** Percentage of the file that has been uploaded */
        progress: number;
        /** Total bytes of the file that has been uploaded */
        loaded: number;
        /** How many bytes have been uploaded since the last progress event for this file */
        delta: number;
        /** Total bytes uploaded for all files in this upload */
        totalLoaded: number;
        /** Percentage of the total loaded bytes for the upload */
        totalProgress: number;
      }) => void)
    | undefined;
  /**
   * Set custom headers that'll get sent with requests
   * to your server
   */
  headers?: HeadersInit | (() => MaybePromise<HeadersInit>) | undefined;
} & ExtendObjectIf<
  inferEndpointInput<TFileRoute>,
  { input: inferEndpointInput<TFileRoute> }
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
  /**
   * The uploadthing package that is making this request
   * @example "@uploadthing/react"
   *
   * This is used to identify the client in the server logs
   */
  package?: string;
};

export type EndpointArg<
  TRouter extends FileRouter,
  TEndpoint extends keyof TRouter,
> = TEndpoint | ((_: RouteRegistry<TRouter>) => TEndpoint);

export type RouteRegistry<TRouter extends FileRouter> = {
  [k in keyof TRouter]: k;
};
