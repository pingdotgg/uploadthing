/* eslint-disable @typescript-eslint/no-empty-interface */

import type { Blob as NodeBlob } from "buffer";
import type * as Config from "effect/Config";
import type * as LogLevel from "effect/LogLevel";

import type {
  ACL,
  ContentDisposition,
  Either,
  FetchEsque,
  MaybeUrl,
  SerializedUploadThingError,
  Time,
} from "@uploadthing/shared";

import type { LogFormat } from "../internal/logger";
import type { UploadedFileData } from "../types";

export interface UTApiOptions {
  /**
   * Provide a custom fetch function.
   * @default globalThis.fetch
   */
  fetch?: FetchEsque;
  /**
   * Provide a custom UploadThing token
   * @default process.env.UPLOADTHING_TOKEN
   */
  token?: string;
  /**
   * @default "info"
   */
  logLevel?: LogLevel.Literal;
  /**
   * What format log entries should be in
   * @default "pretty" in development, else "json"
   * @see https://effect.website/docs/guides/observability/logging#built-in-loggers
   */
  logFormat?: Config.Config.Success<typeof LogFormat>;
  /**
   * Set the default key type for file operations. Allows you to set your preferred filter
   * for file keys or custom identifiers without needing to specify it on every call.
   * @default "fileKey"
   */
  defaultKeyType?: "fileKey" | "customId";
  /**
   * URL override for the API server
   */
  apiUrl?: string;
  /**
   * URL override for the ingest server
   */
  ingestUrl?: string;
}

export type UrlWithOverrides = {
  url: MaybeUrl;
  name?: string;
  customId?: string;
};

type BlobEsque = NodeBlob | Blob;
export type FileEsque = BlobEsque & {
  name: string;
  lastModified?: number;
  customId?: string | null | undefined;
};

export interface UploadFilesOptions {
  contentDisposition?: ContentDisposition;
  acl?: ACL;
  /**
   * AbortSignal that can be used to cancel the upload
   */
  signal?: AbortSignal;
}
export type UploadFileResult = Either<
  UploadedFileData,
  SerializedUploadThingError
>;

interface KeyTypeOptionsBase {
  /**
   * Whether the provided key is a fileKey or a custom identifier. fileKey is the
   * identifier you get from UploadThing after uploading a file, customId is a
   * custom identifier you provided when uploading a file.
   * @default fileKey
   */
  keyType?: "fileKey" | "customId";
}

export interface DeleteFilesOptions extends KeyTypeOptionsBase {}

export interface GetFileUrlsOptions extends KeyTypeOptionsBase {}

export interface ListFilesOptions {
  limit?: number;
  offset?: number;
}

type KeyRename = { fileKey: string; newName: string };
type CustomIdRename = { customId: string; newName: string };
export type RenameFileUpdate = KeyRename | CustomIdRename;

export interface GetSignedURLOptions extends KeyTypeOptionsBase {
  /**
   * How long the URL will be valid for.
   * - Must be positive and less than 7 days (604800 seconds).
   * - You must accept overrides on the UploadThing dashboard for this option to be accepted.
   * @default app default on UploadThing dashboard
   */
  expiresIn?: Time;
}

export interface ACLUpdateOptions extends KeyTypeOptionsBase {}
