import type { IncomingHttpHeaders } from "node:http";

import type { MimeType } from "@uploadthing/mime-types/db";

import type { AllowedFileType } from "./file-types";

export type JsonValue = string | number | boolean | null | undefined;
export type JsonArray = JsonValue[];
export type JsonObject = { [key: string]: JsonValue | JsonObject | JsonArray };
export type Json = JsonValue | JsonObject | JsonArray;

export type Overwrite<T, U> = Omit<T, keyof U> & U;
export type WithRequired<T, K extends keyof T> = T & Required<Pick<T, K>>;

/**
 * A subset of the standard RequestInit properties needed by UploadThing internally.
 * @see RequestInit from lib.dom.d.ts
 */
export interface RequestInitEsque {
  /**
   * Sets the request's body.
   */
  body?: FormData | ReadableStream | string | null;

  /**
   * Sets the request's associated headers.
   */
  headers?: [string, string][] | Record<string, string>;

  /**
   * The request's HTTP-style method.
   */
  method?: string;
}

/**
 * A subset of the standard Response properties needed by UploadThing internally.
 * @see Response from lib.dom.d.ts
 */
export interface ResponseEsque {
  status: number;
  ok: boolean;
  /**
   * @remarks
   * The built-in Response::json() method returns Promise<any>, but
   * that's not as type-safe as unknown. We use unknown because we're
   * more type-safe. You do want more type safety, right? 😉
   */
  json<T = unknown>(): Promise<T>;
  text(): Promise<string>;
  blob(): Promise<Blob>;

  headers: Headers;

  clone(): ResponseEsque;
}

export type MaybeUrl = string | URL;

/**
 * A subset of the standard fetch function type needed by UploadThing internally.
 * @see fetch from lib.dom.d.ts
 */
export type FetchEsque = (
  input: RequestInfo | MaybeUrl,
  init?: RequestInit | RequestInitEsque,
) => Promise<ResponseEsque>;

export type RequestLike = Overwrite<
  WithRequired<Partial<Request>, "json" | "text">,
  {
    body?: any; // we only use `.json`, don't care about `body`
    headers: Headers | IncomingHttpHeaders;
  }
>;

/** This matches the return type from the infra */
export interface FileData {
  id: string;
  createdAt: string;

  fileKey: string | null;
  fileName: string;
  fileSize: number;
  metadata: string | null;

  callbackUrl: string;
  callbackSlug: string;
}

export type UploadedFile = {
  name: string;
  key: string;
  url: string;
  size: number;
};

type PowOf2 = 1 | 2 | 4 | 8 | 16 | 32 | 64 | 128 | 256 | 512 | 1024;
export type SizeUnit = "B" | "KB" | "MB" | "GB";
export type FileSize = `${PowOf2}${SizeUnit}`;

export type ContentDisposition = "inline" | "attachment";
type RouteConfig = {
  maxFileSize: FileSize;
  maxFileCount: number;
  contentDisposition: ContentDisposition;
};

export type FileRouterInputKey = AllowedFileType | MimeType;

export type ExpandedRouteConfig = Partial<{
  [key in FileRouterInputKey]: RouteConfig;
}>;

type PartialRouteConfig = Partial<
  Record<FileRouterInputKey, Partial<RouteConfig>>
>;

export type FileRouterInputConfig = FileRouterInputKey[] | PartialRouteConfig;
