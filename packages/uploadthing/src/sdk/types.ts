import type { File as UndiciFile } from "undici";

import type { FetchEsque, MaybeUrl } from "@uploadthing/shared";

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
