import { Array, Effect, Schema } from "effect";

import type { Command } from "../types";
import { makeUploadThingApiRequest } from "../utils";

type KeyRename = { fileKey: string; newName: string };
type CustomIdRename = { customId: string; newName: string };
export type RenameFileUpdate = KeyRename | CustomIdRename;

export interface RenameFilesOptions {
  updates: RenameFileUpdate | RenameFileUpdate[];
}

export class RenameFileResponse extends Schema.Class<RenameFileResponse>(
  "RenameFileResponse",
)({
  success: Schema.Boolean,
}) {}

export const RenameFilesCommand = Effect.fn("RenameFilesCommand")(function* (
  options: RenameFilesOptions,
) {
  const { updates } = options;

  const response = yield* makeUploadThingApiRequest(
    "/v6/renameFiles",
    { updates: Array.ensure(updates) },
    RenameFileResponse,
  );

  return response;
}) satisfies Command;
