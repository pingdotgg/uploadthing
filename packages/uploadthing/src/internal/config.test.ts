import * as S from "@effect/schema/Schema";
import { it } from "@effect/vitest";
import * as ConfigProvider from "effect/ConfigProvider";
import * as Effect from "effect/Effect";
import * as Exit from "effect/Exit";
import * as Layer from "effect/Layer";
import { describe, expect } from "vitest";

import { UploadThingError } from "@uploadthing/shared";

import { envProvider, getToken } from "./config";
import { UTToken } from "./shared-schemas";

const app1TokenData = { apiKey: "sk_foo", appId: "app-1", regions: ["fra1"] };
const app2TokenData = { apiKey: "sk_bar", appId: "app-2", regions: ["dub1"] };

describe("envProvider", () => {
  it.effect("fails if no token is provided as env", () =>
    Effect.gen(function* () {
      const token = yield* getToken.pipe(
        Effect.provide(Layer.setConfigProvider(envProvider)),
        Effect.exit,
      );

      expect(token).toEqual(
        Exit.fail(
          new UploadThingError({
            code: "MISSING_ENV",
            message:
              "Missing token. Please set the `UPLOADTHING_TOKEN` environment variable or provide a token manually through config.",
          }),
        ),
      );
    }),
  );

  it.effect("fails if an invalid token is provided", () =>
    Effect.gen(function* () {
      process.env.UPLOADTHING_TOKEN = "some-token-that-is-not-a-token";

      const token = yield* getToken.pipe(
        Effect.provide(Layer.setConfigProvider(envProvider)),
        Effect.exit,
      );

      expect(token).toEqual(
        Exit.fail(
          new UploadThingError({
            code: "MISSING_ENV",
            message:
              "Invalid token. A token is a base64 encoded JSON object matching { apiKey: string, appId: string, regions: string[] }.",
          }),
        ),
      );

      delete process.env.UPLOADTHING_TOKEN;
    }),
  );

  it.effect("succeeds if token is provided as env", () =>
    Effect.gen(function* () {
      process.env.UPLOADTHING_TOKEN = yield* S.encode(UTToken)(app1TokenData);

      const token = yield* getToken.pipe(
        Effect.provide(Layer.setConfigProvider(envProvider)),
        Effect.exit,
      );

      expect(token).toEqual(Exit.succeed(app1TokenData));

      delete process.env.UPLOADTHING_TOKEN;
    }),
  );
});

describe("with options map", () => {
  it.effect("fails if no token is provided as option", () =>
    Effect.gen(function* () {
      const token = yield* getToken.pipe(
        Effect.provide(
          Layer.setConfigProvider(
            ConfigProvider.fromJson({
              noToken: "here",
            }).pipe(ConfigProvider.orElse(() => envProvider)),
          ),
        ),
        Effect.exit,
      );

      expect(token).toEqual(
        Exit.fail(
          new UploadThingError({
            code: "MISSING_ENV",
            message:
              "Missing token. Please set the `UPLOADTHING_TOKEN` environment variable or provide a token manually through config.",
          }),
        ),
      );
    }),
  );

  it.effect("fails if an invalid token is provided as option", () =>
    Effect.gen(function* () {
      const badToken = "some-token";

      const token = yield* getToken.pipe(
        Effect.provide(
          Layer.setConfigProvider(
            ConfigProvider.fromJson({ token: badToken }).pipe(
              ConfigProvider.orElse(() => envProvider),
            ),
          ),
        ),
        Effect.exit,
      );

      expect(token).toEqual(
        Exit.fail(
          new UploadThingError({
            code: "MISSING_ENV",
            message:
              "Invalid token. A token is a base64 encoded JSON object matching { apiKey: string, appId: string, regions: string[] }.",
          }),
        ),
      );
    }),
  );

  it.effect("succeeds if token is provided as option", () =>
    Effect.gen(function* () {
      const testTokenStr = yield* S.encode(UTToken)(app1TokenData);

      const token = yield* getToken.pipe(
        Effect.provide(
          Layer.setConfigProvider(
            ConfigProvider.fromJson({ token: testTokenStr }).pipe(
              ConfigProvider.orElse(() => envProvider),
            ),
          ),
        ),
        Effect.exit,
      );

      expect(token).toEqual(Exit.succeed(app1TokenData));
    }),
  );

  it.effect("options take precedence over env", () =>
    Effect.gen(function* () {
      process.env.UPLOADTHING_TOKEN = yield* S.encode(UTToken)(app1TokenData);

      const token2Str = yield* S.encode(UTToken)(app2TokenData);

      const token = yield* getToken.pipe(
        Effect.provide(
          Layer.setConfigProvider(
            ConfigProvider.fromJson({
              token: token2Str,
            }).pipe(ConfigProvider.orElse(() => envProvider)),
          ),
        ),
        Effect.exit,
      );

      expect(token).toEqual(Exit.succeed(app2TokenData));

      delete process.env.UPLOADTHING_TOKEN;
    }),
  );
});
