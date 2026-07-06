import * as Config from "effect/Config";
import * as Effect from "effect/Effect";
import * as Layer from "effect/Layer";
import * as Logger from "effect/Logger";
import type * as LogLevel from "effect/LogLevel";
import * as References from "effect/References";
import type * as HttpBody from "effect/unstable/http/HttpBody";
import type * as HttpClientError from "effect/unstable/http/HttpClientError";
import type * as HttpClientResponse from "effect/unstable/http/HttpClientResponse";

import { UploadThingError } from "@uploadthing/shared";

import { IsDevelopment } from "./config";

export const withMinimalLogLevel = Config.logLevel("logLevel").pipe(
  Config.withDefault("Info" as const),
  Effect.map((level) => Layer.succeed(References.MinimumLogLevel, level)),
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
  Layer.unwrap,
);

export const LogFormat = Config.literals(
  ["json", "logFmt", "structured", "pretty"],
  "logFormat",
);
export type LogFormat = Effect.Success<typeof LogFormat>;

const loggers = {
  json: Logger.consoleJson,
  logFmt: Logger.consoleLogFmt,
  structured: Logger.consoleStructured,
  pretty: Logger.consolePretty(),
} satisfies Record<LogFormat, Logger.Logger<unknown, void>>;

export const withLogFormat = Effect.gen(function* () {
  const isDev = yield* IsDevelopment;
  const logFormat = yield* LogFormat.pipe(
    Config.withDefault(isDev ? ("pretty" as const) : ("json" as const)),
  );
  return Logger.layer([loggers[logFormat]]);
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
  Layer.unwrap,
);

type HttpClientResponseMixinMethod = "json" | "text" | "arrayBuffer" | "None";

export const logHttpClientResponse = (
  message: string,
  opts?: {
    /** Level to log on, default "Debug" */
    level?: LogLevel.Severity;
    /** What body mixin to use to get the response body, default "json" */
    mixin?: HttpClientResponseMixinMethod;
  },
) => {
  const mixin = opts?.mixin ?? "json";
  const level = opts?.level ?? "Debug";

  return (response: HttpClientResponse.HttpClientResponse) => {
    const consumeBody: Effect.Effect<
      unknown,
      HttpClientError.HttpClientError
    > = mixin !== "None" ? response[mixin] : Effect.void;

    return Effect.flatMap(consumeBody, () =>
      Effect.logWithLevel(level)(`${message} (${response.status})`).pipe(
        Effect.annotateLogs("response", response),
      ),
    );
  };
};

export const logHttpClientError =
  (message: string) =>
  (err: HttpClientError.HttpClientError | HttpBody.HttpBodyError) =>
    err._tag === "HttpClientError" && err.response !== undefined
      ? logHttpClientResponse(message, { level: "Error" })(err.response)
      : Effect.logError(message).pipe(Effect.annotateLogs("error", err));
