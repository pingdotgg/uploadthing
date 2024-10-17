import * as S from "@effect/schema/Schema";
import * as Config from "effect/Config";
import * as ConfigProvider from "effect/ConfigProvider";
import * as Effect from "effect/Effect";

import {
  filterDefinedObjectValues,
  UploadThingError,
} from "@uploadthing/shared";

import { UploadThingToken } from "./shared-schemas";

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
        Object.entries(
          filterDefinedObjectValues(
            // fuck this I give up. import.meta is a mistake, someone else can fix it
            (import.meta as unknown as { env: Record<string, string> })?.env ??
              {},
          ),
        ),
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

export const IsDevelopment = Config.boolean("isDev").pipe(
  Config.orElse(() =>
    Config.succeed(
      typeof process !== "undefined" ? process.env.NODE_ENV : undefined,
    ).pipe(Config.map((_) => _ === "development")),
  ),
  Config.withDefault(false),
);

export const UTToken = S.Config("token", UploadThingToken).pipe(
  Effect.catchTags({
    ConfigError: (e) =>
      new UploadThingError({
        code: e._op === "InvalidData" ? "INVALID_SERVER_CONFIG" : "MISSING_ENV",
        message:
          e._op === "InvalidData"
            ? "Invalid token. A token is a base64 encoded JSON object matching { apiKey: string, appId: string, regions: string[] }."
            : "Missing token. Please set the `UPLOADTHING_TOKEN` environment variable or provide a token manually through config.",
        cause: e,
      }),
  }),
);

export const ApiUrl = Config.string("apiUrl").pipe(
  Config.withDefault("https://api.uploadthing.com"),
  Config.mapAttempt((_) => new URL(_)),
  Config.map((url) => url.href.replace(/\/$/, "")),
);

export const IngestUrl = Effect.gen(function* () {
  const { regions, ingestHost } = yield* UTToken;
  const region = regions[0]; // Currently only support 1 region per app

  return yield* Config.string("ingestUrl").pipe(
    Config.withDefault(`https://${region}.${ingestHost}`),
    Config.mapAttempt((_) => new URL(_)),
    Config.map((url) => url.href.replace(/\/$/, "")),
  );
});
