import { Array, Effect, Schema } from "effect";

import type { Command } from "../types";
import { makeUploadThingApiRequest } from "../utils";

export interface GetFileUrlsOptions {
  /**
   * The keys of the files to get the URLs for.
   */
  keys: string[] | string;
  /**
   * Whether the provided key is a fileKey or a custom identifier. fileKey is the
   * identifier you get from UploadThing after uploading a file, customId is a
   * custom identifier you provided when uploading a file.
   * @default fileKey
   */
  keyType?: "fileKey" | "customId";
}

export class GetFileUrlResponse extends Schema.Class<GetFileUrlResponse>(
  "GetFileUrlResponse",
)({
  data: Schema.Array(
    Schema.Struct({
      key: Schema.String,
      url: Schema.String,
    }),
  ),
}) {}

export const GetFileUrlsCommand = Effect.fn("GetFileUrlsCommand")(function* (
  options: GetFileUrlsOptions,
) {
  const { keys, keyType = "fileKey" } = options;

  const response = yield* makeUploadThingApiRequest(
    "/v6/getFileUrl",
    keyType === "fileKey"
      ? { fileKeys: Array.ensure(keys) }
      : { customIds: Array.ensure(keys) },
    GetFileUrlResponse,
  );

  return response.data;
}) satisfies Command;
