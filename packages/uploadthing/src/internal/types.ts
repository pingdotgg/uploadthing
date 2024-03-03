/* eslint-disable @typescript-eslint/ban-types */

import type {
  ErrorMessage,
  FetchEsque,
  FileRouterInputConfig,
  Json,
  MaybePromise,
  Simplify,
  UploadedFile,
  UploadThingError,
} from "@uploadthing/shared";

import type { UploadThingResponse } from "../types";
import type { LogLevel } from "./logger";
import type { JsonParser } from "./parser";

//
// Utils
export const unsetMarker = "unsetMarker" as "unsetMarker" & {
  __brand: "unsetMarker";
};
export type UnsetMarker = typeof unsetMarker;

//
// Package
export const UTFiles = Symbol("uploadthing-custom-id-symbol");
export type ValidMiddlewareObject = {
  [UTFiles]?: { name: string; size: number; customId: string | null }[];
  [key: string]: unknown;
};

type ResolverOptions<TParams extends AnyParams> = {
  metadata: Simplify<
    TParams["_metadata"] extends UnsetMarker
      ? undefined
      : Omit<TParams["_metadata"], typeof UTFiles>
  >;

  file: UploadedFile;
};

export type AnyRuntime = "app" | "pages" | "web" | "express" | "fastify" | "h3";

export type MiddlewareFnArgs<TRequest, TResponse, TEvent> = {
  req: TRequest;
  res: TResponse;
  event: TEvent;
};
export type AnyMiddlewareFnArgs = MiddlewareFnArgs<any, any, any>;

export interface AnyParams {
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
    files: UTEvents["upload"]["files"];
    input: TInput extends UnsetMarker ? undefined : TInput;
  },
) => MaybePromise<TOutput>;

type ResolverFn<TOutput extends Json | void, TParams extends AnyParams> = (
  opts: ResolverOptions<TParams>,
) => MaybePromise<TOutput>;

type UploadErrorFn = (input: {
  error: UploadThingError;
  fileKey: string;
}) => void;

export interface UploadBuilder<TParams extends AnyParams> {
  input: <TParser extends JsonParser>(
    parser: TParams["_input"] extends UnsetMarker
      ? TParser
      : ErrorMessage<"input is already set">,
  ) => UploadBuilder<{
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
    _input: TParams["_input"];
    _metadata: TOutput;
    _middlewareArgs: TParams["_middlewareArgs"];
    _errorShape: TParams["_errorShape"];
    _errorFn: TParams["_errorFn"];
    _output: UnsetMarker;
  }>;
  onUploadComplete: <TOutput extends Json | void>(
    fn: ResolverFn<TOutput, TParams>,
  ) => Uploader<{
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
  inputParser: JsonParser;
  middleware: MiddlewareFn<TParams["_input"], {}, TParams["_middlewareArgs"]>;
  errorFormatter: (err: UploadThingError) => TParams["_errorShape"];
  onUploadError: UploadErrorFn;
};

export interface Uploader<TParams extends AnyParams> {
  _def: TParams & UploadBuilderDef<TParams>;
  resolver: ResolverFn<TParams["_output"], TParams>;
}

export type FileRouter<TParams extends AnyParams = AnyParams> = Record<
  string,
  Uploader<TParams>
>;

type RouteHandlerConfig = {
  logLevel?: LogLevel;
  callbackUrl?: string;
  uploadthingId?: string;
  uploadthingSecret?: string;
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
};

export type RouterWithConfig<TRouter extends FileRouter> = {
  router: TRouter;
  config?: RouteHandlerConfig;
};

type RequestHandlerInput<TArgs extends AnyMiddlewareFnArgs> = {
  req: Request;
  middlewareArgs: TArgs;
};
type RequestHandlerOutput = Promise<
  | {
      status: number;
      body?: UploadThingResponse;
      cleanup?: Promise<unknown>;
    }
  | UploadThingError
>;

export type RequestHandler<TArgs extends AnyMiddlewareFnArgs> = (
  input: RequestHandlerInput<TArgs>,
) => RequestHandlerOutput;

export type inferEndpointInput<TUploader extends Uploader<any>> =
  TUploader["_def"]["_input"] extends UnsetMarker
    ? undefined
    : TUploader["_def"]["_input"];

export type inferEndpointOutput<TUploader extends Uploader<any>> =
  TUploader["_def"]["_output"] extends UnsetMarker | void | undefined
    ? null
    : TUploader["_def"]["_output"];

export type inferErrorShape<TRouter extends FileRouter> =
  TRouter[keyof TRouter]["_def"]["_errorShape"];

export const VALID_ACTION_TYPES = [
  "upload",
  "failure",
  "multipart-complete",
] as const;
export type ActionType = (typeof VALID_ACTION_TYPES)[number];

export type UTEvents = {
  upload: {
    files: { name: string; size: number }[];
    input: Json;
  };
  failure: {
    fileKey: string;
    uploadId: string | null;
    s3Error?: string;
    fileName: string;
  };
  "multipart-complete": {
    fileKey: string;
    uploadId: string;
    etags: {
      tag: string;
      partNumber: number;
    }[];
  };
};
