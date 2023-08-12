/* eslint-disable @typescript-eslint/ban-types */
import type { NextApiRequest, NextApiResponse } from "next";
import type { NextRequest } from "next/server";

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

//
// Package
type ResolverOptions<TParams extends AnyParams> = {
  metadata: Simplify<
    TParams["_metadata"] extends UnsetMarker ? undefined : TParams["_metadata"]
  >;

  file: UploadedFile;
};

export type AnyRuntime = "app" | "pages" | "web";
export interface AnyParams {
  _input: any;
  _metadata: any; // imaginary field used to bind metadata return type to an Upload resolver
  _runtime: any;
  _errorShape: any;
}

type MiddlewareFnArgs<TParams extends AnyParams> =
  TParams["_runtime"] extends "web"
    ? { req: Request; res?: never; input: TParams["_input"] }
    : TParams["_runtime"] extends "app"
    ? { req: NextRequest; res?: never; input: TParams["_input"] }
    : { req: NextApiRequest; res: NextApiResponse; input: TParams["_input"] };

type MiddlewareFn<
  TOutput extends Record<string, unknown>,
  TParams extends AnyParams,
> = (opts: MiddlewareFnArgs<TParams>) => MaybePromise<TOutput>;

type ResolverFn<TParams extends AnyParams> = (
  opts: ResolverOptions<TParams>,
) => MaybePromise<void>;

export type ErrorMessage<TError extends string> = TError;

export interface UploadBuilder<TParams extends AnyParams> {
  input: <TParser extends JsonParser>(
    parser: TParams["_input"] extends UnsetMarker
      ? TParser
      : ErrorMessage<"input is already set">,
  ) => UploadBuilder<{
    _input: TParser["_output"];
    _metadata: TParams["_metadata"];
    _runtime: TParams["_runtime"];
    _errorShape: TParams["_errorShape"];
  }>;
  middleware: <TOutput extends Record<string, unknown>>(
    fn: TParams["_metadata"] extends UnsetMarker
      ? MiddlewareFn<TOutput, TParams>
      : ErrorMessage<"middleware is already set">,
  ) => UploadBuilder<{
    _input: TParams["_input"];
    _metadata: TOutput;
    _runtime: TParams["_runtime"];
    _errorShape: TParams["_errorShape"];
  }>;

  onUploadComplete: (fn: ResolverFn<TParams>) => Uploader<TParams>;
}

export type UploadBuilderDef<TParams extends AnyParams> = {
  routerConfig: FileRouterInputConfig;
  inputParser: JsonParser;
  middleware: MiddlewareFn<{}, TParams>;
  errorFormatter: (err: UploadThingError) => TParams["_errorShape"];
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
