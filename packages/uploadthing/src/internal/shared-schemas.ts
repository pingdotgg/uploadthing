import * as S from "@effect/schema/Schema";

import type { FileRouterInputKey, Json } from "@uploadthing/shared";
import { ContentDispositionSchema } from "@uploadthing/shared";

/**
 * =============================================================================
 * ======================== File Type Hierarchy ===============================
 * =============================================================================
 */

export const FileUploadDataSchema = S.struct({
  name: S.string,
  size: S.number,
  type: S.string,
});
/**
 * Properties from the web File object, this is what the client sends when initiating an upload
 */
export type FileUploadData = S.Schema.Type<typeof FileUploadDataSchema>;

export const FileUploadDataWithCustomIdSchema = S.extend(
  FileUploadDataSchema,
  S.struct({
    customId: S.nullable(S.string),
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
  S.struct({
    key: S.string,
    url: S.string,
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

export const PresignedBaseSchema = S.struct({
  key: S.string,
  fileName: S.string,
  fileType: S.string as S.Schema<FileRouterInputKey>,
  fileUrl: S.string,
  pollingJwt: S.string,
  pollingUrl: S.string,
  contentDisposition: ContentDispositionSchema,
  customId: S.nullable(S.string),
});

export const MPUResponseSchema = S.extend(
  PresignedBaseSchema,
  S.struct({
    urls: S.array(S.string),
    uploadId: S.string,
    chunkSize: S.number,
    chunkCount: S.number,
  }),
);

export const PSPResponseSchema = S.extend(
  PresignedBaseSchema,
  S.struct({
    url: S.string,
    fields: S.record(S.string, S.string),
  }),
);

export const PresignedURLResponseSchema = S.array(
  S.union(PSPResponseSchema, MPUResponseSchema),
);

/**
 * =============================================================================
 * ======================== Client Action Payloads ============================
 * =============================================================================
 */

export const UploadActionPayload = S.struct({
  files: S.array(FileUploadDataSchema),
  input: S.unknown as S.Schema<Json>,
});

export const FailureActionPayload = S.struct({
  fileKey: S.string,
  uploadId: S.nullable(S.string),
  s3Error: S.optional(S.string),
  fileName: S.string,
});

export const MultipartCompleteActionPayload = S.struct({
  fileKey: S.string,
  uploadId: S.string,
  etags: S.array(
    S.struct({
      tag: S.string,
      partNumber: S.number,
    }),
  ),
});
