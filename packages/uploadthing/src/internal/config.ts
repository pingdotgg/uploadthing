import * as S from "@effect/schema/Schema";
import * as Config from "effect/Config";
import * as ConfigProvider from "effect/ConfigProvider";
import * as Effect from "effect/Effect";

import {
  filterDefinedObjectValues,
  UploadThingError,
} from "@uploadthing/shared";

import { UTToken } from "./shared-schemas";

export { version as UPLOADTHING_VERSION } from "../../package.json";

/**
 * Merge in `import.meta.env` to the built-in `process.env` provider
 * Prefix keys with `UPLOADTHING_` so we can reference just the name.
 * @example
 * process.env.UPLOADTHING_TOKEN = "foo"
 * Config.string("token"); // Config<"foo">
 */
const envProvider = ConfigProvider.fromEnv().pipe(
  ConfigProvider.orElse(() =>
    ConfigProvider.fromMap(
      new Map(
        Object.entries(filterDefinedObjectValues(import.meta?.env ?? {})),
      ),
      {
        pathDelim: "_",
      },
    ),
  ),
  ConfigProvider.nested("uploadthing"),
  ConfigProvider.constantCase,
);

/**
 * Config provider that merges the options from the object
 * and environment variables prefixed with `UPLOADTHING_`.
 * @remarks Options take precedence over environment variables.
 */
export const configProvider = (options: unknown) =>
  ConfigProvider.fromJson(options ?? {}).pipe(
    ConfigProvider.orElse(() => envProvider),
  );

export const isDevelopment = Config.boolean("isDev").pipe(
  Config.withDefault(
    typeof process !== "undefined" && process.env.NODE_ENV === "development",
  ),
);

export const utToken = S.Config("token", UTToken).pipe(
  Effect.catchTags({
    ConfigError: (e) =>
      new UploadThingError({
        code: e._op === "InvalidData" ? "INVALID_ENV" : "MISSING_ENV",
        message:
          e._op === "InvalidData"
            ? "Invalid token. A token is a base64 encoded JSON object matching { apiKey: string, appId: string, regions: string[] }."
            : "Missing token. Please set the `UPLOADTHING_TOKEN` environment variable or provide a token manually through config.",
        cause: e,
      }),
  }),
);

export const apiUrl = Config.string("apiUrl").pipe(
  Config.withDefault("https://api.uploadthing.com"),
);

export const ingestUrl = Effect.gen(function* () {
  const { regions } = yield* utToken;
  const region = regions[0]; // Currently only support 1 region per app

  return yield* Config.string("ingestUrl").pipe(
    Config.withDefault(`https://${region}.ingest.uploadthing.com`),
  );
});
