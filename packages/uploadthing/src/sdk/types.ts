import type { HttpClient } from "@effect/platform";
import type { Config, Effect, LogLevel, ParseResult } from "effect";

import type { FetchEsque, UploadThingError } from "@uploadthing/shared";

import type { LogFormat } from "../_internal/logger";

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

export type Command<TOptions = any, TOutput = any> = (
  options: TOptions,
) => Effect.Effect<
  TOutput,
  UploadThingError | ParseResult.ParseError,
  HttpClient.HttpClient
>;
