import * as S from "@effect/schema/Schema";
import * as Config from "effect/Config";
import * as ConfigProvider from "effect/ConfigProvider";
import * as Effect from "effect/Effect";

import { UploadThingError } from "@uploadthing/shared";

import { UTToken } from "./shared-schemas";

export { version as UPLOADTHING_VERSION } from "../../package.json";

export const envProvider = ConfigProvider.fromEnv().pipe(
  ConfigProvider.orElse(() =>
    ConfigProvider.fromMap(
      new Map(
        Object.entries(import.meta?.env ?? {}).filter(
          (pair): pair is [string, string] => typeof pair[1] === "string",
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

export const isDevelopment = Config.boolean("isDev").pipe(
  Config.withDefault(
    typeof process !== "undefined" && process.env.NODE_ENV === "development",
  ),
);

export const getToken = S.Config("token", UTToken).pipe(
  Effect.catchTags({
    ConfigError: (e) =>
      new UploadThingError({
        code: "MISSING_ENV",
        message:
          e._op === "InvalidData"
            ? "Invalid token. A token is a base64 encoded JSON object matching { apiKey: string, appId: string, regions: string[] }."
            : "Missing token. Please set the `UPLOADTHING_TOKEN` environment variable or provide a token manually through config.",
        cause: e,
      }),
  }),
);

export const ingestUrl = Effect.gen(function* () {
  const { regions } = yield* getToken;
  const region = regions[0]; // Currently only support 1 region per app

  return yield* Config.string("ingestUrl").pipe(
    Config.withDefault(`https://${region}.ingest.uploadthing.com`),
  );
});
