import * as Config from "effect/Config";
import * as Effect from "effect/Effect";
import * as Layer from "effect/Layer";
import * as Logger from "effect/Logger";
import * as LogLevel from "effect/LogLevel";

import { UploadThingError } from "@uploadthing/shared";

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
