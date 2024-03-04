import * as S from "@effect/schema/Schema";

import type { FileRouterInputKey, Json } from "@uploadthing/shared";
import { ContentDisposition } from "@uploadthing/shared";

/**
 * These schemas are for validating input between the user's and UT server
 * Returned by `/api/prepareUpload` and `/api/uploadFiles`
 */
const PresignedBaseSchema = S.struct({
  key: S.string,
  fileName: S.string,
  fileType: S.string as S.Schema<FileRouterInputKey>,
  fileUrl: S.string,
  pollingJwt: S.string,
  pollingUrl: S.string,
  customId: S.nullable(S.string),
});

export const MPUResponseSchema = S.extend(
  PresignedBaseSchema,
  S.struct({
    urls: S.array(S.string),
    uploadId: S.string,
    chunkSize: S.number,
    chunkCount: S.number,
    contentDisposition: ContentDisposition,
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
 * These schemas are for validating input between the client and user's server
 */

export const UploadActionPayload = S.struct({
  files: S.array(
    S.struct({
      name: S.string,
      size: S.number,
      type: S.string,
    }),
  ),
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
