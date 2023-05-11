import type { NextApiRequest, NextApiResponse } from "next";
import { NextRequest } from "next/server";

// Utils
export const unsetMarker = "unsetMarker" as "unsetMarker" & {
  __brand: "unsetMarker";
};
export type UnsetMarker = typeof unsetMarker;

type Simplify<TType> = { [TKey in keyof TType]: TType[TKey] } & {};

export type MaybePromise<TType> = TType | Promise<TType>;

// Package
export type AnyRuntime = "app" | "pages" | "web";
export interface AnyParams {
  _metadata: any; // imaginary field used to bind metadata return type to an Upload resolver
  _runtime: any;
}

type UploadedFile = {
  name: string;
  key: string;
  url: string;
};

type AllowedFiles = "image" | "video" | "audio" | "blob";

export type SizeUnit = "B" | "KB" | "MB" | "GB";
type PowOf2 = 1 | 2 | 4 | 8 | 16 | 32 | 64 | 128 | 256 | 512 | 1024;
export type FileSize = `${PowOf2}${SizeUnit}`;

type ResolverOptions<TParams extends AnyParams> = {
  metadata: Simplify<
    TParams["_metadata"] extends UnsetMarker ? undefined : TParams["_metadata"]
  >;

  file: UploadedFile;
};

export type ReqMiddlewareFn<TOutput extends Record<string, unknown>> = (
  req: Request
) => MaybePromise<TOutput>;
export type NextReqMiddlewareFn<TOutput extends Record<string, unknown>> = (
  req: NextRequest
) => MaybePromise<TOutput>;
export type NextApiMiddlewareFn<TOutput extends Record<string, unknown>> = (
  req: NextApiRequest,
  res: NextApiResponse
) => MaybePromise<TOutput>;

type MiddlewareFn<
  TOutput extends Record<string, unknown>,
  TRuntime extends string
> = TRuntime extends "web"
  ? ReqMiddlewareFn<TOutput>
  : TRuntime extends "app"
  ? NextReqMiddlewareFn<TOutput>
  : NextApiMiddlewareFn<TOutput>;

type ResolverFn<TParams extends AnyParams> = (
  opts: ResolverOptions<TParams>
) => MaybePromise<void>;

export interface UploadBuilder<TParams extends AnyParams> {
  fileTypes: (types: AllowedFiles[]) => UploadBuilder<TParams>;
  maxSize: (size: FileSize) => UploadBuilder<TParams>;

  middleware: <TOutput extends Record<string, unknown>>(
    fn: MiddlewareFn<TOutput, TParams["_runtime"]>
  ) => UploadBuilder<{
    _metadata: TOutput;
    _runtime: TParams["_runtime"];
  }>;

  onUploadComplete: (fn: ResolverFn<TParams>) => Uploader<TParams>;
}

export type UploadBuilderDef<TRuntime extends AnyRuntime> = {
  fileTypes: AllowedFiles[];
  maxSize: FileSize;
  middleware: MiddlewareFn<{}, TRuntime>;
};

export interface Uploader<TParams extends AnyParams> {
  _def: TParams & UploadBuilderDef<TParams["_runtime"]>;
  resolver: ResolverFn<TParams>;
}

export type FileRouter<TParams extends AnyParams = AnyParams> = Record<
  string,
  Uploader<TParams>
>;
