import { Array, Effect, Schema } from "effect";

import type { Command } from "../types";
import { makeUploadThingApiRequest } from "../utils";

export interface DeleteFilesOptions {
  /**
   * The keys of the files to delete.
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

export class DeleteFileResponse extends Schema.Class<DeleteFileResponse>(
  "DeleteFileResponse",
)({
  success: Schema.Boolean,
  deletedCount: Schema.Number,
}) {}

export const DeleteFilesCommand = Effect.fn("DeleteFilesCommand")(function* (
  options: DeleteFilesOptions,
) {
  const { keys, keyType = "fileKey" } = options;

  const response = yield* makeUploadThingApiRequest(
    "/v6/deleteFiles",
    keyType === "fileKey"
      ? { fileKeys: Array.ensure(keys) }
      : { customIds: Array.ensure(keys) },
    DeleteFileResponse,
  );

  return response;
}) satisfies Command;
