import * as S from "@effect/schema/Schema";
import * as Effect from "effect/Effect";

import { UploadThingError } from "@uploadthing/shared";

const DecodeString = S.transform(S.Uint8ArrayFromSelf, S.String, {
  decode: (data) => new TextDecoder().decode(data),
  encode: (data) => new TextEncoder().encode(data),
});

export const UTToken = S.Base64.pipe(
  S.compose(DecodeString),
  S.compose(
    S.parseJson(
      S.Struct({
        apiKey: S.String.pipe(S.startsWith("sk_")),
        appId: S.String,
        regions: S.Array(S.String),
      }),
    ),
  ),
);

export const getToken = (manual?: string) =>
  Effect.if(typeof manual === "string", {
    onTrue: () => S.decode(UTToken)(manual!),
    onFalse: () => S.Config("UPLOADTHING_TOKEN", UTToken),
  }).pipe(
    Effect.catchTags({
      ConfigError: (e) =>
        Effect.fail(
          new UploadThingError({
            code: "MISSING_ENV",
            message:
              "Missing token. Please set the `UPLOADTHING_TOKEN` environment variable or provide a token manually through config.",
            cause: e,
          }),
        ),
      ParseError: (e) =>
        Effect.fail(
          new UploadThingError({
            code: "MISSING_ENV",
            message:
              "Invalid token. A token is a base64 encoded JSON object matching { apiKey: string, appId: string, regions: string[] }",
            cause: e,
          }),
        ),
    }),
  );
