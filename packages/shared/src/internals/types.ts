import type { IncomingHttpHeaders } from "node:http";

import type { MimeType } from "@uploadthing/mime-types/db";

export type JsonValue = string | number | boolean | null | undefined;
export type JsonArray = JsonValue[];
export type JsonObject = { [key: string]: JsonValue | JsonObject | JsonArray };
export type Json = JsonValue | JsonObject | JsonArray;

export type Overwrite<T, U> = Omit<T, keyof U> & U;
export type WithRequired<T, K extends keyof T> = T & Required<Pick<T, K>>;

export const ALLOWED_FILE_TYPES = [
  "image",
  "video",
  "audio",
  "pdf",
  "text",
  "blob",
] as const;

export type AllowedFileType = (typeof ALLOWED_FILE_TYPES)[number];

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
  WithRequired<Partial<Request>, "json">,
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
    uploadId: string;
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

export const unsetMarker = "unsetMarker" as "unsetMarker" & {
  __brand: "unsetMarker";
};
export type UnsetMarker = typeof unsetMarker;

// eslint-disable-next-line @typescript-eslint/ban-types
export type Simplify<TType> = { [TKey in keyof TType]: TType[TKey] } & {};

export type MaybePromise<TType> = TType | Promise<TType>;

/**
 * Omits the key without removing a potential union
 * @internal
 */
export type DistributiveOmit<TObj, TKey extends keyof any> = TObj extends any
  ? Omit<TObj, TKey>
  : never;
