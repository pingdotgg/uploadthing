import type { Schema } from "effect/Schema";

import type {
  ErrorMessage,
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

/**
 * Different frameworks have different request and response types
 */
export type AdapterFnArgs<TRequest, TResponse, TEvent> = {
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
  _adapterFnArgs: AdapterFnArgs<any, any, any>;
  _errorShape: any;
  _errorFn: any; // used for onUploadError
  _output: any;
}

type MiddlewareFn<
  TInput extends Json | UnsetMarker,
  TOutput extends ValidMiddlewareObject,
  TArgs extends AdapterFnArgs<any, any, any>,
> = (
  opts: TArgs & {
    files: Schema.Type<typeof UploadActionPayload>["files"];
    input: TInput extends UnsetMarker ? undefined : TInput;
  },
) => MaybePromise<TOutput>;

type UploadCompleteFn<
  TMetadata,
  TOutput extends JsonObject | void,
  TArgs extends AdapterFnArgs<any, any, any>,
> = (
  opts: TArgs & {
    metadata: TMetadata;
    file: UploadedFileData;
  },
) => MaybePromise<TOutput>;

type UploadErrorFn<TArgs extends AdapterFnArgs<any, any, any>> = (
  input: TArgs & {
    error: UploadThingError;
    fileKey: string;
  },
) => MaybePromise<void>;

export interface UploadBuilder<TParams extends AnyParams> {
  input: <TParser extends JsonParser>(
    parser: TParams["_input"]["in"] extends UnsetMarker
      ? TParser
      : ErrorMessage<"input is already set">,
  ) => UploadBuilder<{
    _routeOptions: TParams["_routeOptions"];
    _input: { in: TParser["_input"]; out: TParser["_output"] };
    _metadata: TParams["_metadata"];
    _adapterFnArgs: TParams["_adapterFnArgs"];
    _errorShape: TParams["_errorShape"];
    _errorFn: TParams["_errorFn"];
    _output: UnsetMarker;
  }>;
  middleware: <TOutput extends ValidMiddlewareObject>(
    fn: TParams["_metadata"] extends UnsetMarker
      ? MiddlewareFn<
          TParams["_input"]["out"],
          TOutput,
          TParams["_adapterFnArgs"]
        >
      : ErrorMessage<"middleware is already set">,
  ) => UploadBuilder<{
    _routeOptions: TParams["_routeOptions"];
    _input: TParams["_input"];
    _metadata: TOutput;
    _adapterFnArgs: TParams["_adapterFnArgs"];
    _errorShape: TParams["_errorShape"];
    _errorFn: TParams["_errorFn"];
    _output: UnsetMarker;
  }>;
  onUploadError: (
    fn: TParams["_errorFn"] extends UnsetMarker
      ? UploadErrorFn<TParams["_adapterFnArgs"]>
      : ErrorMessage<"onUploadError is already set">,
  ) => UploadBuilder<{
    _routeOptions: TParams["_routeOptions"];
    _input: TParams["_input"];
    _metadata: TParams["_metadata"];
    _adapterFnArgs: TParams["_adapterFnArgs"];
    _errorShape: TParams["_errorShape"];
    _errorFn: UploadErrorFn<TParams["_adapterFnArgs"]>;
    _output: UnsetMarker;
  }>;
  onUploadComplete: <TOutput extends JsonObject | void>(
    fn: UploadCompleteFn<
      Simplify<
        TParams["_metadata"] extends UnsetMarker
          ? undefined
          : Omit<TParams["_metadata"], typeof UTFiles>
      >,
      TOutput,
      TParams["_adapterFnArgs"]
    >,
  ) => FileRoute<{
    input: TParams["_input"]["in"] extends UnsetMarker
      ? undefined
      : TParams["_input"]["in"];
    output: TParams["_routeOptions"]["awaitServerData"] extends false
      ? null
      : TOutput extends void | undefined // JSON serialization
        ? null
        : TOutput;
    errorShape: TParams["_errorShape"];
  }>;
}

export type AnyBuiltUploaderTypes = {
  input: any;
  output: any;
  errorShape: any;
};

export interface FileRoute<TTypes extends AnyBuiltUploaderTypes> {
  $types: TTypes;
  routerConfig: FileRouterInputConfig;
  routeOptions: RouteOptions;
  inputParser: JsonParser;
  middleware: MiddlewareFn<any, ValidMiddlewareObject, any>;
  onUploadError: UploadErrorFn<any>;
  errorFormatter: (err: UploadThingError) => any;
  onUploadComplete: UploadCompleteFn<any, any, any>;
}
export type AnyFileRoute = FileRoute<AnyBuiltUploaderTypes>;

/**
 * Map actionType to the required payload for that action
 * @todo Look into using @effect/rpc :thinking:
 */
export type UTEvents = {
  upload: {
    in: UploadActionPayload;
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
