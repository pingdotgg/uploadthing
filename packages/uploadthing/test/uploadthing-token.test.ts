/* eslint-disable no-restricted-imports */
/* eslint-disable no-restricted-globals */
import { it } from "@effect/vitest";
import { Effect, Exit } from "effect";
import { describe, expect } from "vitest";

import { UploadThingError } from "@uploadthing/shared";

import { getToken } from "../src/internal/uploadthing-token";
import { testToken } from "./__test-helpers";

describe("UploadThing Token", () => {
  it.effect("parses from env", () =>
    Effect.gen(function* () {
      process.env.UPLOADTHING_TOKEN = testToken.encoded;
      const token = yield* getToken();
      expect(token).toEqual(testToken.decoded);
      delete process.env.UPLOADTHING_TOKEN;
    }),
  );

  it.effect("parses from manual", () =>
    Effect.gen(function* () {
      const token = yield* getToken(testToken.encoded);
      expect(token).toEqual(testToken.decoded);
    }),
  );

  it.effect("fails if missing", () =>
    Effect.gen(function* () {
      const result = yield* getToken().pipe(Effect.exit);
      expect(result).toEqual(
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

  it.effect("fails if invalid", () =>
    Effect.gen(function* () {
      const invalidToken = testToken.encoded + "garbage";
      const result = yield* getToken(invalidToken).pipe(Effect.exit);
      expect(result).toEqual(
        Exit.fail(
          new UploadThingError({
            code: "MISSING_ENV",
            message:
              "Invalid token. A token is a base64 encoded JSON object matching { apiKey: string, appId: string, regions: string[] }",
          }),
        ),
      );
    }),
  );
});
