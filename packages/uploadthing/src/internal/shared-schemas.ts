import * as S from "@effect/schema/Schema";

import type { Json } from "@uploadthing/shared";
import { ValidACLs, ValidContentDispositions } from "@uploadthing/shared";

export const ContentDispositionSchema = S.Literal(...ValidContentDispositions);
export const ACLSchema = S.Literal(...ValidACLs);

/**
 * =============================================================================
 * ======================== File Type Hierarchy ===============================
 * =============================================================================
 */

/**
 * Properties from the web File object, this is what the client sends when initiating an upload
 */
export class FileUploadData extends S.Class<FileUploadData>("FileUploadData")({
  name: S.String,
  size: S.Number,
  type: S.String,
}) {}

/**
 * `.middleware()` can add a customId to the incoming file data
 */
export class FileUploadDataWithCustomId extends FileUploadData.extend<FileUploadDataWithCustomId>(
  "FileUploadDataWithCustomId",
)({
  customId: S.NullOr(S.String),
}) {}

/**
 * When files are uploaded, we get back a key and a URL for the file
 */
export class UploadedFileData extends FileUploadDataWithCustomId.extend<UploadedFileData>(
  "UploadedFileData",
)({
  key: S.String,
  url: S.String,
}) {}

/**
 * When the client has uploaded a file and polled for data returned by `.onUploadComplete()`
 */
export interface ClientUploadedFileData<T> extends UploadedFileData {
  /**
   * Matches what's returned from the serverside `onUploadComplete` callback
   */
  readonly serverData: T;
}

/**
 * =============================================================================
 * ======================== Server Response Schemas ============================
 * =============================================================================
 */

export class PollUploadResponse extends S.Class<PollUploadResponse>(
  "PollUploadResponse",
)({
  status: S.String,
  file: S.optional(
    S.Struct({
      fileKey: S.String,
      fileName: S.String,
      fileSize: S.Number,
      fileType: S.String,
      fileUrl: S.String,
      customId: S.NullOr(S.String),

      callbackUrl: S.optional(S.String),
      callbackSlug: S.optional(S.String),
    }),
  ),
  metadata: S.optional(S.Unknown),
  callbackData: S.optional(S.Unknown),
}) {}

export class FailureCallbackResponse extends S.Class<FailureCallbackResponse>(
  "FailureCallbackResponse",
)({
  success: S.Boolean,
  message: S.optional(S.String),
}) {}

export class NewPresignedUrl extends S.Class<NewPresignedUrl>(
  "NewPresignedUrl",
)({
  url: S.String,
  key: S.String,
  customId: S.NullOr(S.String),
  name: S.String,
}) {}

export class IngestCollectResponse extends S.Class<IngestCollectResponse>(
  "IngestCollectResponse",
)({
  ok: S.Boolean,
}) {}

export class IngestUploadResponse extends S.Class<IngestUploadResponse>(
  "IngestUploadResponse",
)({
  url: S.String,
  serverData: S.Unknown,
}) {}

/**
 * =============================================================================
 * ======================== Client Action Payloads ============================
 * =============================================================================
 */

export class UploadActionPayload extends S.Class<UploadActionPayload>(
  "UploadActionPayload",
)({
  files: S.Array(FileUploadData),
  input: S.Unknown as S.Schema<Json>,
}) {}
