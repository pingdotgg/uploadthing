import * as S from "@effect/schema/Schema";

import type { FileRouterInputKey, Json } from "@uploadthing/shared";
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

export class PresignedBase extends S.Class<PresignedBase>(
  "PresignedBaseSchema",
)({
  key: S.String,
  fileName: S.String,
  fileType: S.String as S.Schema<FileRouterInputKey>,
  fileUrl: S.String,
  pollingJwt: S.String,
  pollingUrl: S.String,
  contentDisposition: ContentDispositionSchema,
  customId: S.NullOr(S.String),
}) {}

export class MPUResponse extends PresignedBase.extend<MPUResponse>(
  "MPUResponseSchema",
)({
  urls: S.Array(S.String),
  uploadId: S.String,
  chunkSize: S.Number,
  chunkCount: S.Number,
}) {}

export class PSPResponse extends PresignedBase.extend<PSPResponse>(
  "PSPResponseSchema",
)({
  url: S.String,
  fields: S.Record(S.String, S.String),
}) {}

export const PresignedURLResponse = S.Array(S.Union(PSPResponse, MPUResponse));

export class PollUploadResponse extends S.Class<PollUploadResponse>(
  "PollUploadResponse",
)({
  status: S.String,
  fileData: S.optional(
    S.Struct({
      fileKey: S.NullOr(S.String),
      fileName: S.String,
      fileSize: S.Number,
      fileType: S.String,
      metadata: S.NullOr(S.String),
      customId: S.NullOr(S.String),

      callbackUrl: S.optional(S.String),
      callbackSlug: S.optional(S.String),
    }),
  ),
}) {}

export class FailureCallbackResponse extends S.Class<FailureCallbackResponse>(
  "FailureCallbackResponse",
)({
  success: S.Boolean,
  message: S.optional(S.String),
}) {}

export class ServerCallbackPostResponse extends S.Class<ServerCallbackPostResponse>(
  "ServerCallbackPostResponse",
)({
  status: S.String,
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

export class FailureActionPayload extends S.Class<FailureActionPayload>(
  "FailureActionPayload",
)({
  fileKey: S.String,
  uploadId: S.NullOr(S.String),
  storageProviderError: S.optional(S.String),
  fileName: S.String,
}) {}

export class MultipartCompleteActionPayload extends S.Class<MultipartCompleteActionPayload>(
  "MultipartCompleteActionPayload",
)({
  fileKey: S.String,
  uploadId: S.String,
  etags: S.Array(
    S.Struct({
      tag: S.String,
      partNumber: S.Number,
    }),
  ),
}) {}
