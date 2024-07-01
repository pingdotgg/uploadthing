import * as S from "@effect/schema/Schema";

import type { Json } from "@uploadthing/shared";
import { ValidACLs, ValidContentDispositions } from "@uploadthing/shared";

export const ContentDispositionSchema = S.Literal(...ValidContentDispositions);
export const ACLSchema = S.Literal(...ValidACLs);

/**
 * =============================================================================
 * =========================== Configuration ===================================
 * =============================================================================
 */
const DecodeString = S.transform(S.Uint8ArrayFromSelf, S.String, {
  decode: (data) => new TextDecoder().decode(data),
  encode: (data) => new TextEncoder().encode(data),
});

export const UploadThingToken = S.Base64.pipe(
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
  lastModified: S.optional(S.Number),
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

export class NewPresignedUrl extends S.Class<NewPresignedUrl>(
  "NewPresignedUrl",
)({
  url: S.String,
  key: S.String,
  customId: S.NullOr(S.String),
  name: S.String,
}) {}

export class MetadataFetchStreamPart extends S.Class<MetadataFetchStreamPart>(
  "MetadataFetchStreamPart",
)({
  payload: S.String,
  signature: S.String,
}) {}

export class MetadataFetchResponse extends S.Class<MetadataFetchResponse>(
  "MetadataFetchResponse",
)({
  ok: S.Boolean,
}) {}

export class CallbackResultResponse extends S.Class<CallbackResultResponse>(
  "CallbackResultResponse",
)({
  ok: S.Boolean,
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
