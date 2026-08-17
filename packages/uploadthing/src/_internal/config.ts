import * as Config from "effect/Config";
import * as ConfigProvider from "effect/ConfigProvider";
import * as Effect from "effect/Effect";
import * as S from "effect/Schema";

import { UploadThingError } from "@uploadthing/shared";

import { UploadThingToken } from "./shared-schemas";

export { version as UPLOADTHING_VERSION } from "../../package.json";

/**
 * The built-in `ConfigProvider.fromEnv` provider merges `process.env` and
 * `import.meta.env` out of the box. It snapshots the environment when it is
 * created, so it's constructed lazily to pick up late `process.env` mutations.
 * Prefix keys with `UPLOADTHING_` so we can reference just the name.
 * @example
 * process.env.UPLOADTHING_TOKEN = "foo"
 * Config.string("token"); // Config<"foo">
 */
const envProvider = () =>
  ConfigProvider.fromEnv().pipe(
    ConfigProvider.nested("uploadthing"),
    ConfigProvider.constantCase,
  );

/**
 * Config provider that merges the options from the object
 * and environment variables prefixed with `UPLOADTHING_`.
 * @remarks Options take precedence over environment variables.
 */
export const configProvider = (options: unknown) =>
  ConfigProvider.fromUnknown(options ?? {}).pipe(
    ConfigProvider.orElse(envProvider()),
  );

export const IsDevelopment = Config.boolean("isDev").pipe(
  Config.orElse(() =>
    Config.succeed(
      typeof process !== "undefined" ? process.env.NODE_ENV : undefined,
    ).pipe(Config.map((_) => _ === "development")),
  ),
  Config.withDefault(false),
);

export const UTToken = Config.string("token").pipe(
  Effect.catchTag(
    "ConfigError",
    (e) =>
      new UploadThingError({
        code: "MISSING_ENV",
        message:
          "Missing token. Please set the `UPLOADTHING_TOKEN` environment variable or provide a token manually through config.",
        cause: e,
      }),
  ),
  Effect.flatMap((rawToken) =>
    S.decodeUnknownEffect(UploadThingToken)(rawToken).pipe(
      Effect.catchTag(
        "SchemaError",
        (e) =>
          new UploadThingError({
            code: "INVALID_SERVER_CONFIG",
            message:
              "Invalid token. A token is a base64 encoded JSON object matching { apiKey: string, appId: string, regions: string[] }.",
            cause: e,
          }),
      ),
    ),
  ),
);

export const ApiUrl = Config.url("apiUrl").pipe(
  Config.withDefault(new URL("https://api.uploadthing.com")),
  Config.map((url) => url.href.replace(/\/$/, "")),
);

export const IngestUrl = Effect.fn(function* (
  preferredRegion: string | undefined,
) {
  const { regions, ingestHost } = yield* UTToken;

  const region = preferredRegion
    ? (regions.find((r) => r === preferredRegion) ?? regions[0])
    : regions[0];

  return yield* Config.url("ingestUrl").pipe(
    Config.withDefault(new URL(`https://${region}.${ingestHost}`)),
    Config.map((url) => url.href.replace(/\/$/, "")),
  );
});

export const UtfsHost = Config.string("utfsHost").pipe(
  Config.withDefault("utfs.io"),
);

export const UfsHost = Config.string("ufsHost").pipe(
  Config.withDefault("ufs.sh"),
);

export const UfsAppIdLocation = Config.literals(
  ["subdomain", "path"],
  "ufsAppIdLocation",
).pipe(Config.withDefault("subdomain"));
