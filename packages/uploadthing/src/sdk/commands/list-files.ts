import { Effect, Schema } from "effect";

import type { Command } from "../types";
import { makeUploadThingApiRequest } from "../utils";

export interface ListFilesOptions {
  /**
   * The number of files to return.
   * @default 100
   */
  limit?: number;
  /**
   * The number of files to skip.
   * @default 0
   */
  offset?: number;
}

class ListFileStruct extends Schema.Class<ListFileStruct>("ListFileStruct")(
  Schema.Struct({
    id: Schema.String,
    customId: Schema.NullOr(Schema.String),
    key: Schema.String,
    name: Schema.String,
    size: Schema.Number,
    status: Schema.Literal(
      "Deletion Pending",
      "Failed",
      "Uploaded",
      "Uploading",
    ),
    uploadedAt: Schema.DateFromNumber,
  }),
) {}

export class ListFileResponse extends Schema.Class<ListFileResponse>(
  "ListFileResponse",
)({
  hasMore: Schema.Boolean,
  files: Schema.Array(ListFileStruct),
}) {}

export const ListFilesCommand = Effect.fn("ListFilesCommand")(function* (
  options: ListFilesOptions,
) {
  const response = yield* makeUploadThingApiRequest(
    "/v6/listFiles",
    { ...options },
    ListFileResponse,
  );

  return {
    hasMore: response.hasMore,
    files: response.files.map((file) => ListFileStruct.make(file)),
  };
}) satisfies Command;
