import type { MimeType } from "@uploadthing/mime-types";

import type { AllowedFileType } from "./file-types";

export type JsonValue = string | number | boolean | null | undefined;
export type JsonArray = JsonValue[];
export type JsonObject = { [key: string]: JsonValue | JsonObject | JsonArray };
export type Json = JsonValue | JsonObject | JsonArray;

export type Overwrite<T, U> = Omit<T, keyof U> & U;
export type WithRequired<T, K extends keyof T> = T & Required<Pick<T, K>>;
export type ErrorMessage<TError extends string> = TError;
// eslint-disable-next-line @typescript-eslint/ban-types
export type Simplify<TType> = { [TKey in keyof TType]: TType[TKey] } & {};
export type MaybePromise<TType> = TType | Promise<TType>;
export type Either<TData, TError> =
  | { data: TData; error: null }
  | { data: null; error: TError };
export type ExtendObjectIf<Predicate, ToAdd> = undefined extends Predicate
  ? // eslint-disable-next-line @typescript-eslint/ban-types
    {}
  : ToAdd;
export type DeepPartial<T> = T extends object
  ? {
      [P in keyof T]?: DeepPartial<T[P]>;
    }
  : T;

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

export const ValidContentDispositions = ["inline", "attachment"] as const;
export type ContentDisposition = (typeof ValidContentDispositions)[number];

export const ValidACLs = ["public-read", "private"] as const;
export type ACL = (typeof ValidACLs)[number];

type ImageProperties = {
  /** Specify the width of the image. */
  width?: number;
  /** Specify the height of the image. */
  height?: number;
  /**
   * Specify the aspect ratio of the image.
   * @remarks If both width and height are specified, this will be ignored.
   */
  aspectRatio?: number;
};

type AdditionalProperties<T> = Record<string, unknown> & T;

type RouteConfig<TAdditionalProperties extends Record<string, unknown>> = {
  /**
   * Human-readable file size limit
   * @example "1MB"
   * @default https://docs.uploadthing.com/api-reference/server#defaults
   */
  maxFileSize: FileSize;
  /**
   * Maximum number of files allowed to be uploaded of this type
   * @example 10
   * @default https://docs.uploadthing.com/api-reference/server#defaults
   */
  maxFileCount: number;
  /**
   * Minimum number of files allowed to be uploaded of this type
   * @remarks Must be <= maxFileCount
   * @example 2
   * @default 1
   */
  minFileCount: number;
  /**
   * Specify the [content disposition](https://developer.mozilla.org/en-US/docs/Web/HTTP/Headers/Content-Disposition) of the uploaded file
   * @example "attachment"
   * @default "inline"
   */
  contentDisposition: ContentDisposition;
  /**
   * Specify the [access control list](https://developer.mozilla.org/en-US/docs/Web/HTTP/Headers/Access-Control-Allow-Origin) of the uploaded file
   * @remarks This must be enabled for your app. See https://docs.uploadthing.com/regions-and-acl#access-controls.
   * @example "private"
   * @default "public-read"
   */
  acl?: ACL;
  /**
   * Additional properties to be passed to the client-side `useRouteConfig` hook
   * @remarks These properties are not validated on the server on upload
   */
  additionalProperties?: AdditionalProperties<TAdditionalProperties>;
};

/**
 * Shared config options for an entire route not bound to any specific file type
 * @example
 * ```ts
 * f(
 *   { image: {} },
 *   { awaitServerData: true },
 * )
 * ```
 */
export type RouteOptions = {
  /**
   * Set this to `true` to wait for the server onUploadComplete data
   * on the client before running `onClientUploadComplete`.
   * @default false
   */
  awaitServerData?: boolean;
};

export type FileRouterInputKey = AllowedFileType | MimeType;

export type ExpandedRouteConfig = {
  [key in FileRouterInputKey]?: key extends `image${string}`
    ? RouteConfig<ImageProperties>
    : RouteConfig<Record<string, unknown>>;
};

export type EndpointMetadata = {
  slug: string;
  config: ExpandedRouteConfig;
}[];

export type FileRouterInputConfig =
  | FileRouterInputKey[]
  | DeepPartial<ExpandedRouteConfig>;
