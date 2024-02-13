import * as S from "@effect/schema/Schema";

import type { FileRouterInputKey } from "@uploadthing/shared";
import { ContentDisposition } from "@uploadthing/shared";

const baseResponseSchema = S.struct({
  key: S.string,
  fileName: S.string,
  fileType: S.string as S.Schema<FileRouterInputKey>,
  fileUrl: S.string,

  pollingJwt: S.string,
  pollingUrl: S.string,
});

export const mpuSchema = S.extend(
  baseResponseSchema,
  S.struct({
    urls: S.array(S.string),
    uploadId: S.string,
    chunkSize: S.number,
    chunkCount: S.number,
    contentDisposition: ContentDisposition,
  }),
);
export type MPUResponse = S.Schema.To<typeof mpuSchema>;

export const pspSchema = S.extend(
  baseResponseSchema,
  S.struct({
    url: S.string,
    fields: S.record(S.string, S.string),
  }),
);
export type PSPResponse = S.Schema.To<typeof pspSchema>;

export const uploadThingResponseSchema = S.array(S.union(pspSchema, mpuSchema));
export type UploadThingResponse = S.Schema.To<typeof uploadThingResponseSchema>;
