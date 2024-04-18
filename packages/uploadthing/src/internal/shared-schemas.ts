import * as S from "@effect/schema/Schema";

import type { FileRouterInputKey, Json } from "@uploadthing/shared";
import { ContentDispositionSchema } from "@uploadthing/shared";

/**
 * =============================================================================
 * ======================== File Type Hierarchy ===============================
 * =============================================================================
 */

export const FileUploadDataSchema = S.Struct({
  name: S.String,
  size: S.Number,
  type: S.String,
});
/**
 * Properties from the web File object, this is what the client sends when initiating an upload
 */
export type FileUploadData = S.Schema.Type<typeof FileUploadDataSchema>;

export const FileUploadDataWithCustomIdSchema = S.extend(
  FileUploadDataSchema,
  S.Struct({
    customId: S.NullOr(S.String),
  }),
);
/**
 * `.middleware()` can add a customId to the incoming file data
 */
export type FileUploadDataWithCustomId = S.Schema.Type<
  typeof FileUploadDataWithCustomIdSchema
>;

export const UploadedFileDataSchema = S.extend(
  FileUploadDataWithCustomIdSchema,
  S.Struct({
    key: S.String,
    url: S.String,
  }),
);
/**
 * When files are uploaded, we get back a key and a URL for the file
 */
export type UploadedFileData = S.Schema.Type<typeof UploadedFileDataSchema>;

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

export const PresignedBaseSchema = S.Struct({
  key: S.String,
  fileName: S.String,
  fileType: S.String as S.Schema<FileRouterInputKey>,
  fileUrl: S.String,
  pollingJwt: S.String,
  pollingUrl: S.String,
  contentDisposition: ContentDispositionSchema,
  customId: S.NullOr(S.String),
});

export const MPUResponseSchema = S.extend(
  PresignedBaseSchema,
  S.Struct({
    urls: S.Array(S.String),
    uploadId: S.String,
    chunkSize: S.Number,
    chunkCount: S.Number,
  }),
);

export const PSPResponseSchema = S.extend(
  PresignedBaseSchema,
  S.Struct({
    url: S.String,
    fields: S.Record(S.String, S.String),
  }),
);

export const PresignedURLResponseSchema = S.Array(
  S.Union(PSPResponseSchema, MPUResponseSchema),
);

export const PollUploadResponseSchema = S.Struct({
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
});

/**
 * =============================================================================
 * ======================== Client Action Payloads ============================
 * =============================================================================
 */

export const UploadActionPayload = S.Struct({
  files: S.Array(FileUploadDataSchema),
  input: S.Unknown as S.Schema<Json>,
});

export const FailureActionPayload = S.Struct({
  fileKey: S.String,
  uploadId: S.NullOr(S.String),
  storageProviderError: S.optional(S.String),
  fileName: S.String,
});

export const MultipartCompleteActionPayload = S.Struct({
  fileKey: S.String,
  uploadId: S.String,
  etags: S.Array(
    S.Struct({
      tag: S.String,
      partNumber: S.Number,
    }),
  ),
});
