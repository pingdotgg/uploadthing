import type { NextApiRequest, NextApiResponse } from "next";
import type { NextRequest } from "next/server";

import type { FileRouterInputConfig, UploadedFile } from "@uploadthing/shared";

// Utils
export const unsetMarker = "unsetMarker" as "unsetMarker" & {
  __brand: "unsetMarker";
};
export type UnsetMarker = typeof unsetMarker;

type Simplify<TType> = { [TKey in keyof TType]: TType[TKey] } & {};

type ResolverOptions<TParams extends AnyParams> = {
  metadata: Simplify<
    TParams["_metadata"] extends UnsetMarker ? undefined : TParams["_metadata"]
  >;

  file: UploadedFile;
};

export type MaybePromise<TType> = TType | Promise<TType>;

// Package
export type AnyRuntime = "app" | "pages" | "web";
export interface AnyParams {
  _metadata: any; // imaginary field used to bind metadata return type to an Upload resolver
  _runtime: any;
}

type MiddlewareFnArgs<TRuntime> = TRuntime extends "web"
  ? { req: Request; res: never }
  : TRuntime extends "app"
  ? { req: NextRequest; res: never }
  : { req: NextApiRequest; res: NextApiResponse };

type MiddlewareFn<
  TOutput extends Record<string, unknown>,
  TRuntime extends string,
> = MiddlewareFnArgs<TRuntime>["res"] extends never
  ? (req: MiddlewareFnArgs<TRuntime>["req"]) => MaybePromise<TOutput>
  : (
      req: MiddlewareFnArgs<TRuntime>["req"],
      res: MiddlewareFnArgs<TRuntime>["res"],
    ) => MaybePromise<TOutput>;

export type ReqMiddlewareFn<TOutput extends Record<string, unknown>> =
  MiddlewareFn<TOutput, "web">;
export type NextReqMiddlewareFn<TOutput extends Record<string, unknown>> =
  MiddlewareFn<TOutput, "app">;
export type NextApiMiddlewareFn<TOutput extends Record<string, unknown>> =
  MiddlewareFn<TOutput, "pages">;

type ResolverFn<TParams extends AnyParams> = (
  opts: ResolverOptions<TParams>,
) => MaybePromise<void>;

export interface UploadBuilder<TParams extends AnyParams> {
  middleware: <TOutput extends Record<string, unknown>>(
    fn: MiddlewareFn<TOutput, TParams["_runtime"]>,
  ) => UploadBuilder<{
    _metadata: TOutput;
    _runtime: TParams["_runtime"];
  }>;

  onUploadComplete: (fn: ResolverFn<TParams>) => Uploader<TParams>;
}

export type UploadBuilderDef<TRuntime extends AnyRuntime> = {
  routerConfig: FileRouterInputConfig;
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
