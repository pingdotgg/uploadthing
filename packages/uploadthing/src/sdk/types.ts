/* eslint-disable @typescript-eslint/no-empty-interface */
import type { File as UndiciFile } from "undici";

import type {
  ACL,
  ContentDisposition,
  FetchEsque,
  Json,
  MaybeUrl,
  Time,
} from "@uploadthing/shared";

import type { LogLevel } from "../internal/logger";

export interface UTApiOptions {
  /**
   * Provide a custom fetch function.
   * @default globalThis.fetch
   */
  fetch?: FetchEsque;
  /**
   * Provide a custom UploadThing API key.
   * @default process.env.UPLOADTHING_SECRET
   */
  apiKey?: string;
  /**
   * @default "info"
   */
  logLevel?: LogLevel;
  /**
   * Set the default key type for file operations. Allows you to set your preferred filter
   * for file keys or custom identifiers without needing to specify it on every call.
   * @default "fileKey"
   */
  defaultKeyType?: "fileKey" | "customId";
}

export type UrlWithOverrides = {
  url: MaybeUrl;
  name?: string;
  customId?: string;
};

export type FileEsque =
  | (Blob & { name: string; customId?: string })
  | UndiciFile;

export type UploadData = {
  key: string;
  url: string;
  name: string;
  size: number;
};

export type UploadError = {
  code: string;
  message: string;
  data: any;
};

export type UploadFileResponse =
  | { data: UploadData; error: null }
  | { data: null; error: UploadError };

export interface UploadFilesOptions {
  metadata?: Json;
  contentDisposition?: ContentDisposition;
  acl?: ACL;
}

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

type KeyRename = { key: string; newName: string };
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
