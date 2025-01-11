import { Duration, Effect, Schema } from "effect";

import { parseTimeToSeconds } from "@uploadthing/shared";
import type { Time } from "@uploadthing/shared";

import type { Command } from "../types";
import { makeUploadThingApiRequest } from "../utils";

export class GetSignedURLOptions extends Schema.Class<GetSignedURLOptions>(
  "GetSignedURLOptions",
)({
  /**
   * The key of the file to get the signed URL for.
   */
  key: Schema.String,
  /**
   * Whether the provided key is a fileKey or a custom identifier. fileKey is the
   * identifier you get from UploadThing after uploading a file, customId is a
   * custom identifier you provided when uploading a file.
   * @default fileKey
   */
  keyType: Schema.optional(
    Schema.Union(Schema.Literal("fileKey"), Schema.Literal("customId")),
  ),
  /**
   * How long the URL will be valid for.
   * - You must accept overrides on the UploadThing dashboard for this option to be accepted.
   * @default app default on UploadThing dashboard
   */
  expiresIn: Schema.optional(
    Schema.transform(
      Schema.String as Schema.Schema<Time>,
      Schema.Int.pipe(Schema.filter((n) => n > 0 || "Must be positive")),
      {
        strict: true,
        decode: (time) => parseTimeToSeconds(time),
        encode: (time) => time,
      },
    ),
  ),
}) {}

Duration.decode("1 hour");

export class GetSignedUrlResponse extends Schema.Class<GetSignedUrlResponse>(
  "GetSignedUrlResponse",
)({
  url: Schema.String,
}) {}

export const GetSignedURLCommand = Effect.fn("GetSignedURLCommand")(function* (
  options: typeof GetSignedURLOptions.Encoded,
) {
  const {
    key,
    keyType = "fileKey",
    expiresIn,
  } = yield* Schema.decode(GetSignedURLOptions)(options);

  const response = yield* makeUploadThingApiRequest(
    "/v6/requestFileAccess",
    keyType === "fileKey"
      ? { fileKey: key, expiresIn }
      : { customId: key, expiresIn },
    GetSignedUrlResponse,
  );

  return response;
}) satisfies Command;
