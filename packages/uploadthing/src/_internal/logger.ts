import type {
  HttpBody,
  HttpClientError,
  HttpClientResponse,
} from "@effect/platform";
import * as Config from "effect/Config";
import * as ConfigError from "effect/ConfigError";
import * as Effect from "effect/Effect";
import * as Either from "effect/Either";
import * as Layer from "effect/Layer";
import * as Logger from "effect/Logger";
import * as LogLevel from "effect/LogLevel";

import { UploadThingError } from "@uploadthing/shared";

import { IsDevelopment } from "./config";

/**
 * Config.logLevel counter-intuitively accepts LogLevel["label"]
 * instead of a literal, ripping it and changing to accept literal
 * Effect 4.0 will change this to accept a literal and then we can
 * remove this and go back to the built-in validator.
 */
const ConfigLogLevel = (name?: string): Config.Config<LogLevel.LogLevel> => {
  const config = Config.mapOrFail(Config.string(), (literal) => {
    const level = LogLevel.allLevels.find((level) => level._tag === literal);
    return level === undefined
      ? Either.left(
          ConfigError.InvalidData(
            [],
            `Expected a log level but received ${literal}`,
          ),
        )
      : Either.right(level);
  });
  return name === undefined ? config : Config.nested(config, name);
};

export const withMinimalLogLevel = ConfigLogLevel("logLevel").pipe(
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
export type LogFormat = Config.Config.Success<typeof LogFormat>;

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
