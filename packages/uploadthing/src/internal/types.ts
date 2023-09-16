/* eslint-disable @typescript-eslint/ban-types */
import type { IncomingHttpHeaders } from "node:http";

import type {
  FileRouterInputConfig,
  UploadedFile,
  UploadThingError,
} from "@uploadthing/shared";

import type { JsonParser } from "./parser";

//
// Utils
export const unsetMarker = "unsetMarker" as "unsetMarker" & {
  __brand: "unsetMarker";
};
export type UnsetMarker = typeof unsetMarker;

export type Simplify<TType> = { [TKey in keyof TType]: TType[TKey] } & {};

export type MaybePromise<TType> = TType | Promise<TType>;

export type WithRequired<T, K extends keyof T> = T & Required<Pick<T, K>>;
export type Overwrite<T, U> = Omit<T, keyof U> & U;

export type RequestLike = Overwrite<
  WithRequired<Partial<Request>, "json">,
  {
    body?: any; // we only use `.json`, don't care about `body`
    headers: Headers | IncomingHttpHeaders;
  }
>;
//
// Package
type ResolverOptions<TParams extends AnyParams> = {
  metadata: Simplify<
    TParams["_metadata"] extends UnsetMarker ? undefined : TParams["_metadata"]
  >;

  file: UploadedFile;
};

export type AnyRuntime = "app" | "pages" | "web" | "express" | "fastify";

export type MiddlewareFnArgs<TRequest, TResponse> = {
  req: TRequest;
  res: TResponse;
};
export interface AnyParams {
  _input: any;
  _metadata: any; // imaginary field used to bind metadata return type to an Upload resolver
  _mdwrArgs: MiddlewareFnArgs<any, any>;
  _errorShape: any;
  _errorFn: any; // used for onUploadError
}

type MiddlewareFn<
  TInput extends JSON | UnsetMarker,
  TOutput extends Record<string, unknown>,
  TArgs extends MiddlewareFnArgs<any, any>,
> = (
  opts: TArgs & (TInput extends UnsetMarker ? {} : { input: TInput }),
) => MaybePromise<TOutput>;

type ResolverFn<TParams extends AnyParams> = (
  opts: ResolverOptions<TParams>,
) => MaybePromise<void>;

type UploadErrorFn = (input: {
  error: UploadThingError;
  fileKey: string;
}) => void;

export type ErrorMessage<TError extends string> = TError;

export interface UploadBuilder<TParams extends AnyParams> {
  input: <TParser extends JsonParser>(
    parser: TParams["_input"] extends UnsetMarker
      ? TParser
      : ErrorMessage<"input is already set">,
  ) => UploadBuilder<{
    _input: TParser["_output"];
    _metadata: TParams["_metadata"];
    _mdwrArgs: TParams["_mdwrArgs"];
    _errorShape: TParams["_errorShape"];
    _errorFn: TParams["_errorFn"];
  }>;
  middleware: <TOutput extends Record<string, unknown>>(
    fn: TParams["_metadata"] extends UnsetMarker
      ? MiddlewareFn<TParams["_input"], TOutput, TParams["_mdwrArgs"]>
      : ErrorMessage<"middleware is already set">,
  ) => UploadBuilder<{
    _input: TParams["_input"];
    _metadata: TOutput;
    _mdwrArgs: TParams["_mdwrArgs"];
    _errorShape: TParams["_errorShape"];
    _errorFn: TParams["_errorFn"];
  }>;

  onUploadComplete: (fn: ResolverFn<TParams>) => Uploader<TParams>;
  onUploadError: (
    fn: TParams["_errorFn"] extends UnsetMarker
      ? UploadErrorFn
      : ErrorMessage<"onUploadError is already set">,
  ) => UploadBuilder<{
    _input: TParams["_input"];
    _metadata: TParams["_metadata"];
    _mdwrArgs: TParams["_mdwrArgs"];
    _errorShape: TParams["_errorShape"];
    _errorFn: UploadErrorFn;
  }>;
}

export type UploadBuilderDef<TParams extends AnyParams> = {
  routerConfig: FileRouterInputConfig;
  inputParser: JsonParser;
  middleware: MiddlewareFn<TParams["_input"], {}, TParams["_mdwrArgs"]>;
  errorFormatter: (err: UploadThingError) => TParams["_errorShape"];
  onUploadError: UploadErrorFn;
};

export interface Uploader<TParams extends AnyParams> {
  _def: TParams & UploadBuilderDef<TParams>;
  resolver: ResolverFn<TParams>;
}

export type FileRouter<TParams extends AnyParams = AnyParams> = Record<
  string,
  Uploader<TParams>
>;

export type inferEndpointInput<TUploader extends Uploader<any>> =
  TUploader["_def"]["_input"] extends UnsetMarker
    ? undefined
    : TUploader["_def"]["_input"];

export type inferErrorShape<TRouter extends FileRouter> =
  TRouter[keyof TRouter]["_def"]["_errorShape"];

export const VALID_ACTION_TYPES = ["upload", "failure"] as const;
export type ActionType = (typeof VALID_ACTION_TYPES)[number];
