import type {
  ACL,
  ContentDisposition,
  FetchEsque,
  Json,
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

export interface UploadFilesOptions {
  metadata?: Json;
  contentDisposition?: ContentDisposition;
  acl?: ACL;
}

export interface ListFilesOptions {
  limit?: number;
  offset?: number;
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

export interface GetSignedURLOptions extends KeyTypeOptionsBase {
  /**
   * How long the URL will be valid for.
   * - Must be positive and less than 7 days (604800 seconds).
   * - You must accept overrides on the UploadThing dashboard for this option to be accepted.
   * @default app default on UploadThing dashboard
   */
  expiresIn?: Time;
}

// eslint-disable-next-line @typescript-eslint/no-empty-interface
export interface GetFileUrlsOptions extends KeyTypeOptionsBase {}

// eslint-disable-next-line @typescript-eslint/no-empty-interface
export interface DeleteFilesOptions extends KeyTypeOptionsBase {}

type KeyRename = { key: string; newName: string };
type CustomIdRename = { customId: string; newName: string };
export type RenameFileUpdate = KeyRename | CustomIdRename;
