import type * as Config from "effect/Config";
import type * as LogLevel from "effect/LogLevel";
import type { Schema } from "effect/Schema";

import type {
  ErrorMessage,
  FetchEsque,
  FileRouterInputConfig,
  Json,
  JsonObject,
  MaybePromise,
  RouteOptions,
  Simplify,
  UploadThingError,
} from "@uploadthing/shared";

import type { LogFormat } from "./logger";
import type { JsonParser } from "./parser";
import type {
  FileUploadDataWithCustomId,
  NewPresignedUrl,
  UploadActionPayload,
  UploadedFileData,
} from "./shared-schemas";

/**
 * Marker used to append a `customId` to the incoming file data in `.middleware()`
 * @example
 * ```ts
 * .middleware((opts) => {
 *   return {
 *     [UTFiles]: opts.files.map((file) => ({
 *       ...file,
 *       customId: generateId(),
 *     }))
 *   };
 * })
 * ```
 */
export const UTFiles = Symbol("uploadthing-custom-id-symbol");

const unsetMarker = "unsetMarker" as "unsetMarker" & {
  __brand: "unsetMarker";
};
export type UnsetMarker = typeof unsetMarker;

export type ValidMiddlewareObject = {
  [UTFiles]?: Partial<FileUploadDataWithCustomId>[];
  [key: string]: unknown;
};

type ResolverOptions<TMetadata> = {
  metadata: TMetadata;
  file: UploadedFileData;
};

/**
 * Different frameworks have different request and response types
 */
export type MiddlewareFnArgs<TRequest, TResponse, TEvent> = {
  req: TRequest;
  res: TResponse;
  event: TEvent;
};

export interface AnyParams {
  _routeOptions: any;
  _input: {
    in: any;
    out: any;
  };
  _metadata: any; // imaginary field used to bind metadata return type to an Upload resolver
  _middlewareArgs: MiddlewareFnArgs<any, any, any>;
  _errorShape: any;
  _errorFn: any; // used for onUploadError
  _output: any;
}

type MiddlewareFn<
  TInput extends Json | UnsetMarker,
  TOutput extends ValidMiddlewareObject,
  TArgs extends MiddlewareFnArgs<any, any, any>,
> = (
  opts: TArgs & {
    files: Schema.Type<typeof UploadActionPayload>["files"];
    input: TInput extends UnsetMarker ? undefined : TInput;
  },
) => MaybePromise<TOutput>;

type UploadCompleteFn<TMetadata, TOutput extends JsonObject | void> = (
  opts: ResolverOptions<TMetadata>,
) => MaybePromise<TOutput>;

type UploadErrorFn = (input: {
  error: UploadThingError;
  fileKey: string;
}) => Promise<void> | void;

export interface UploadBuilder<TParams extends AnyParams> {
  input: <TParser extends JsonParser>(
    parser: TParams["_input"]["in"] extends UnsetMarker
      ? TParser
      : ErrorMessage<"input is already set">,
  ) => UploadBuilder<{
    _routeOptions: TParams["_routeOptions"];
    _input: { in: TParser["_input"]; out: TParser["_output"] };
    _metadata: TParams["_metadata"];
    _middlewareArgs: TParams["_middlewareArgs"];
    _errorShape: TParams["_errorShape"];
    _errorFn: TParams["_errorFn"];
    _output: UnsetMarker;
  }>;
  middleware: <TOutput extends ValidMiddlewareObject>(
    fn: TParams["_metadata"] extends UnsetMarker
      ? MiddlewareFn<
          TParams["_input"]["out"],
          TOutput,
          TParams["_middlewareArgs"]
        >
      : ErrorMessage<"middleware is already set">,
  ) => UploadBuilder<{
    _routeOptions: TParams["_routeOptions"];
    _input: TParams["_input"];
    _metadata: TOutput;
    _middlewareArgs: TParams["_middlewareArgs"];
    _errorShape: TParams["_errorShape"];
    _errorFn: TParams["_errorFn"];
    _output: UnsetMarker;
  }>;
  onUploadError: (
    fn: TParams["_errorFn"] extends UnsetMarker
      ? UploadErrorFn
      : ErrorMessage<"onUploadError is already set">,
  ) => UploadBuilder<{
    _routeOptions: TParams["_routeOptions"];
    _input: TParams["_input"];
    _metadata: TParams["_metadata"];
    _middlewareArgs: TParams["_middlewareArgs"];
    _errorShape: TParams["_errorShape"];
    _errorFn: UploadErrorFn;
    _output: UnsetMarker;
  }>;
  onUploadComplete: <TOutput extends JsonObject | void>(
    fn: UploadCompleteFn<
      Simplify<
        TParams["_metadata"] extends UnsetMarker
          ? undefined
          : Omit<TParams["_metadata"], typeof UTFiles>
      >,
      TOutput
    >,
  ) => Uploader<{
    input: TParams["_input"]["in"] extends UnsetMarker
      ? void
      : TParams["_input"]["in"];
    output: TParams["_routeOptions"]["awaitServerData"] extends false
      ? void
      : TOutput;
    errorShape: TParams["_errorShape"];
  }>;
}

export type BuiltUploaderTypes = {
  input: any;
  output: any;
  errorShape: any;
};

export interface Uploader<TTypes extends BuiltUploaderTypes> {
  $types: TTypes;
  routerConfig: FileRouterInputConfig;
  routeOptions: RouteOptions;
  inputParser: JsonParser;
  middleware: MiddlewareFn<any, ValidMiddlewareObject, any>;
  onUploadError: UploadErrorFn;
  errorFormatter: (err: UploadThingError) => any;
  onUploadComplete: UploadCompleteFn<any, any>;
}
export type AnyUploader = Uploader<BuiltUploaderTypes>;

export type FileRouter = Record<string, AnyUploader>;

export type RouteHandlerConfig = {
  logLevel?: LogLevel.Literal;
  /**
   * What format log entries should be in
   * @default "pretty" in development, else "json"
   * @see https://effect.website/docs/guides/observability/logging#built-in-loggers
   */
  logFormat?: Config.Config.Success<typeof LogFormat>;
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

export type inferEndpointInput<TUploader extends AnyUploader> =
  TUploader["$types"]["input"];

export type inferEndpointOutput<TUploader extends AnyUploader> =
  TUploader["$types"]["output"] extends UnsetMarker | void | undefined
    ? null
    : TUploader["$types"]["output"];

export type inferErrorShape<TRouter extends FileRouter> =
  TRouter[keyof TRouter]["$types"]["errorShape"];

/**
 * Map actionType to the required payload for that action
 * @todo Look into using @effect/rpc :thinking:
 */
export type UTEvents = {
  upload: {
    in: typeof UploadActionPayload.Type;
    out: ReadonlyArray<NewPresignedUrl>;
  };
};

/**
 * Result from the PUT request to the UploadThing Ingest server
 */
export type UploadPutResult<TServerOutput = unknown> = {
  url: string;
  appUrl: string;
  fileHash: string;
  serverData: TServerOutput;
};
