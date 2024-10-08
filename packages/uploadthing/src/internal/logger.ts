import type {
  HttpBody,
  HttpClientError,
  HttpClientResponse,
} from "@effect/platform";
import * as Config from "effect/Config";
import * as Effect from "effect/Effect";
import * as Layer from "effect/Layer";
import * as Logger from "effect/Logger";
import * as LogLevel from "effect/LogLevel";

import { UploadThingError } from "@uploadthing/shared";

import { IsDevelopment } from "./config";

export const withMinimalLogLevel = Config.logLevel("logLevel").pipe(
  Config.withDefault(LogLevel.Info),
  Effect.andThen((level) => Logger.minimumLogLevel(level)),
  Effect.tapError((e) =>
    Effect.logError("Invalid log level").pipe(Effect.annotateLogs("error", e)),
  ),
  Effect.catchTag(
    "ConfigError",
    (e) =>
      new UploadThingError({
        code: "INVALID_SERVER_CONFIG",
        message: "Invalid server configuration",
        cause: e,
      }),
  ),
  Layer.unwrapEffect,
);

export const LogFormat = Config.literal(
  "json",
  "logFmt",
  "structured",
  "pretty",
)("logFormat");

export const withLogFormat = Effect.gen(function* () {
  const isDev = yield* IsDevelopment;
  const logFormat = yield* LogFormat.pipe(
    Config.withDefault(isDev ? "pretty" : "json"),
  );
  return Logger[logFormat];
}).pipe(
  Effect.catchTag(
    "ConfigError",
    (e) =>
      new UploadThingError({
        code: "INVALID_SERVER_CONFIG",
        message: "Invalid server configuration",
        cause: e,
      }),
  ),
  Layer.unwrapEffect,
);

type HttpClientResponseMixinMethod = "json" | "text" | "arrayBuffer" | "None";

export const logHttpClientResponse = (
  message: string,
  opts?: {
    /** Level to log on, default "Debug" */
    level?: LogLevel.Literal;
    /** What body mixin to use to get the response body, default "json" */
    mixin?: HttpClientResponseMixinMethod;
  },
) => {
  const mixin = opts?.mixin ?? "json";
  const level = LogLevel.fromLiteral(opts?.level ?? "Debug");

  return (response: HttpClientResponse.HttpClientResponse) =>
    Effect.flatMap(mixin !== "None" ? response[mixin] : Effect.void, () =>
      Effect.logWithLevel(level, `${message} (${response.status})`).pipe(
        Effect.annotateLogs("response", response),
      ),
    );
};

export const logHttpClientError =
  (message: string) =>
  (err: HttpClientError.HttpClientError | HttpBody.HttpBodyError) =>
    err._tag === "ResponseError"
      ? logHttpClientResponse(message, { level: "Error" })(err.response)
      : Effect.logError(message).pipe(Effect.annotateLogs("error", err));
