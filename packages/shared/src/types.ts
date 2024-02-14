import * as S from "@effect/schema/Schema";

import type { MimeType } from "@uploadthing/mime-types";

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
  statusText: string;
  ok: boolean;
  /**
   * @remarks
   * The built-in Response::json() method returns Promise<any>, but
   * that's not as type-safe as unknown. We use unknown because we're
   * more type-safe. You do want more type safety, right? 😉
   */
  json: <T = unknown>() => Promise<T>;
  text: () => Promise<string>;
  blob: () => Promise<Blob>;

  headers: Headers;

  clone: () => ResponseEsque;
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

/** This matches the return type from the infra */
export const FileData = S.struct({
  id: S.string,
  createdAt: S.string,

  fileKey: S.nullable(S.string),
  fileName: S.string,
  fileSize: S.number,
  metadata: S.nullable(S.string),
  customId: S.nullable(S.string),

  callbackUrl: S.string,
  callbackSlug: S.string,
});
export type FileData = S.Schema.To<typeof FileData>;

export const UploadedFile = S.struct({
  name: S.string,
  key: S.string,
  url: S.string,
  size: S.number,
  customId: S.nullable(S.string),
});
export type UploadedFile = S.Schema.To<typeof UploadedFile>;

type PowOf2 = 1 | 2 | 4 | 8 | 16 | 32 | 64 | 128 | 256 | 512 | 1024;
export type SizeUnit = "B" | "KB" | "MB" | "GB";
export type FileSize = `${PowOf2}${SizeUnit}`;

export type TimeShort = "s" | "m" | "h" | "d";
export type TimeLong = "second" | "minute" | "hour" | "day";
type SuggestedNumbers = 2 | 3 | 4 | 5 | 6 | 7 | 10 | 15 | 30 | 60;
// eslint-disable-next-line @typescript-eslint/ban-types
type AutoCompleteableNumber = SuggestedNumbers | (number & {});
export type Time =
  | number
  | `1${TimeShort}`
  | `${AutoCompleteableNumber}${TimeShort}`
  | `1 ${TimeLong}`
  | `${AutoCompleteableNumber} ${TimeLong}s`;

export const ContentDisposition = S.literal("inline", "attachment");
export type ContentDisposition = S.Schema.To<typeof ContentDisposition>;
export const ACL = S.literal("public-read", "private");
export type ACL = S.Schema.To<typeof ACL>;

type RouteConfig = {
  maxFileSize: FileSize;
  maxFileCount: number;
  contentDisposition: ContentDisposition;
  acl?: ACL; // default is set on UT server, not backfilled like other options
};

export type FileRouterInputKey = AllowedFileType | MimeType;

export type ExpandedRouteConfig = Partial<{
  [key in FileRouterInputKey]: RouteConfig;
}>;

export type EndpointMetadata = {
  slug: string;
  config: ExpandedRouteConfig;
}[];

type PartialRouteConfig = Partial<
  Record<FileRouterInputKey, Partial<RouteConfig>>
>;

export type FileRouterInputConfig = FileRouterInputKey[] | PartialRouteConfig;
