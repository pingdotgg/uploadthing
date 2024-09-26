import type { Schema } from "@effect/schema/Schema";
import type * as LogLevel from "effect/LogLevel";

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

type ResolverOptions<TParams extends AnyParams> = {
  metadata: Simplify<
    TParams["_metadata"] extends UnsetMarker
      ? undefined
      : Omit<TParams["_metadata"], typeof UTFiles>
  >;

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
  _input: any;
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

type ResolverFn<
  TOutput extends JsonObject | void,
  TParams extends AnyParams,
> = (opts: ResolverOptions<TParams>) => MaybePromise<TOutput>;

type UploadErrorFn = (input: {
  error: UploadThingError;
  fileKey: string;
}) => Promise<void> | void;

export interface UploadBuilder<TParams extends AnyParams> {
  input: <TParser extends JsonParser>(
    parser: TParams["_input"] extends UnsetMarker
      ? TParser
      : ErrorMessage<"input is already set">,
  ) => UploadBuilder<{
    _routeOptions: TParams["_routeOptions"];
    _input: TParser["_output"];
    _metadata: TParams["_metadata"];
    _middlewareArgs: TParams["_middlewareArgs"];
    _errorShape: TParams["_errorShape"];
    _errorFn: TParams["_errorFn"];
    _output: UnsetMarker;
  }>;
  middleware: <TOutput extends ValidMiddlewareObject>(
    fn: TParams["_metadata"] extends UnsetMarker
      ? MiddlewareFn<TParams["_input"], TOutput, TParams["_middlewareArgs"]>
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
  onUploadComplete: <TOutput extends JsonObject | void>(
    fn: ResolverFn<TOutput, TParams>,
  ) => Uploader<{
    _routeOptions: TParams["_routeOptions"];
    _input: TParams["_input"];
    _metadata: TParams["_metadata"];
    _middlewareArgs: TParams["_middlewareArgs"];
    _errorShape: TParams["_errorShape"];
    _errorFn: TParams["_errorFn"];
    _output: TOutput;
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
}

export type UploadBuilderDef<TParams extends AnyParams> = {
  routerConfig: FileRouterInputConfig;
  routeOptions: RouteOptions;
  inputParser: JsonParser;
  // eslint-disable-next-line @typescript-eslint/ban-types
  middleware: MiddlewareFn<TParams["_input"], {}, TParams["_middlewareArgs"]>;
  errorFormatter: (err: UploadThingError) => TParams["_errorShape"];
  onUploadError: UploadErrorFn;
};

export interface Uploader<TParams extends AnyParams> {
  _def: TParams & UploadBuilderDef<TParams>;
  resolver: ResolverFn<TParams["_output"], TParams>;
}
export type AnyUploader = Uploader<AnyParams>;

export type FileRouter<TParams extends AnyParams = AnyParams> = Record<
  string,
  Uploader<TParams>
>;

export type RouteHandlerConfig = {
  logLevel?: LogLevel.Literal;
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

export type inferEndpointInput<TUploader extends Uploader<any>> =
  TUploader["_def"]["_input"] extends UnsetMarker
    ? undefined
    : TUploader["_def"]["_input"];

export type inferEndpointOutput<TUploader extends AnyUploader> =
  TUploader["_def"]["_output"] extends UnsetMarker | void | undefined
    ? null
    : TUploader["_def"]["_routeOptions"]["awaitServerData"] extends false
      ? null
      : TUploader["_def"]["_output"];

export type inferErrorShape<TRouter extends FileRouter> =
  TRouter[keyof TRouter]["_def"]["_errorShape"];

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
