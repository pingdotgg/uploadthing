import { Array, Effect, Schema } from "effect";

import type { ACL } from "@uploadthing/shared";

import type { Command } from "../types";
import { makeUploadThingApiRequest } from "../utils";

export interface UpdateACLOptions {
  /**
   * The keys of the files to update the ACL for.
   */
  keys: string[] | string;
  /**
   * The ACL to set for the files.
   */
  acl: ACL;
  /**
   * Whether the provided key is a fileKey or a custom identifier. fileKey is the
   * identifier you get from UploadThing after uploading a file, customId is a
   * custom identifier you provided when uploading a file.
   * @default fileKey
   */
  keyType?: "fileKey" | "customId";
}

export class UpdateACLResponse extends Schema.Class<UpdateACLResponse>(
  "UpdateACLResponse",
)({
  success: Schema.Boolean,
}) {}

export const UpdateACLCommand = Effect.fn("UpdateACLCommand")(function* (
  options: UpdateACLOptions,
) {
  const { keys, acl, keyType = "fileKey" } = options;

  const mappedUpdates = Array.ensure(keys).map((key) =>
    keyType === "fileKey" ? { fileKey: key, acl } : { customId: key, acl },
  );

  const response = yield* makeUploadThingApiRequest(
    "/v6/updateACL",
    { updates: mappedUpdates },
    UpdateACLResponse,
  );

  return response;
}) satisfies Command;
