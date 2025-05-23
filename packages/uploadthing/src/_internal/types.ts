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

export type UTRegionAlias =
  | "bom1"
  | "icn1"
  | "syd1"
  | "can1"
  | "fra1"
  | "zrh1"
  | "dub1"
  | "cle1"
  | "sfo1"
  | "sea1";

/**
 * Marker used to select the region based on the incoming request
 */
export const UTRegion = Symbol("uploadthing-region-symbol");

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

export type UnsetMarker = "unsetMarker" & {
  __brand: "unsetMarker";
};

export type ValidMiddlewareObject = {
  [UTRegion]?: UTRegionAlias;
  [UTFiles]?: Partial<FileUploadDataWithCustomId>[];
  [key: string]: unknown;
};

export interface AnyParams {
  _routeOptions: any;
  _input: {
    in: any;
    out: any;
  };
  _metadata: any; // imaginary field used to bind metadata return type to an Upload resolver
  _adapterFnArgs: Record<string, unknown>;
  _errorShape: any;
  _errorFn: any; // used for onUploadError
  _output: any;
}

type MiddlewareFn<
  TInput extends Json | UnsetMarker,
  TOutput extends ValidMiddlewareObject,
  TArgs extends Record<string, unknown>,
> = (
  opts: TArgs & {
    files: Schema.Type<typeof UploadActionPayload>["files"];
    input: TInput extends UnsetMarker ? undefined : TInput;
  },
) => MaybePromise<TOutput>;

type UploadCompleteFn<
  TMetadata,
  TOutput extends JsonObject | void,
  TArgs extends Record<string, unknown>,
> = (
  opts: TArgs & {
    metadata: TMetadata;
    file: UploadedFileData;
  },
) => MaybePromise<TOutput>;

type UploadErrorFn<TArgs extends Record<string, unknown>> = (
  input: TArgs & {
    error: UploadThingError;
    fileKey: string;
  },
) => MaybePromise<void>;

export interface UploadBuilder<TParams extends AnyParams> {
  input: <TIn extends Json, TOut>(
    parser: TParams["_input"]["in"] extends UnsetMarker
      ? JsonParser<TIn, TOut>
      : ErrorMessage<"input is already set">,
  ) => UploadBuilder<{
    _routeOptions: TParams["_routeOptions"];
    _input: { in: TIn; out: TOut };
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
          : Omit<TParams["_metadata"], typeof UTFiles | typeof UTRegion>
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
  inputParser: JsonParser<any>;
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
  ufsUrl: string;
  /**
   * @deprecated
   * This field will be removed in uploadthing v9. Use `ufsUrl` instead.
   */
  url: string;
  /**
   * @deprecated
   * This field will be removed in uploadthing v9. Use `ufsUrl` instead.
   */
  appUrl: string;
  fileHash: string;
  serverData: TServerOutput;
};
