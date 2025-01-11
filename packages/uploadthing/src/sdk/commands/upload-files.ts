import { Effect, Schema } from "effect";

import type {
  ACL,
  ContentDisposition,
  Either,
  SerializedUploadThingError,
} from "@uploadthing/shared";

import type { UploadedFileData } from "../../types";
import { uploadFile } from "../utils";

export interface BaseUploadOptions {
  /**
   * The content disposition to set for the files.
   */
  contentDisposition?: ContentDisposition;
  /**
   * The ACL to set for the files.
   */
  acl?: ACL;
}

export interface UploadFileOptions extends BaseUploadOptions {
  /**
   * The file to upload.
   */
  file: FileEsque;
}

export interface UploadFilesOptions extends BaseUploadOptions {
  /**
   * The files to upload.
   */
  files: FileEsque[];
}

type BlobEsque = Blob;
export type FileEsque = BlobEsque & {
  name: string;
  lastModified?: number;
  customId?: string | null | undefined;
};

export type UploadFileResult = Either<
  UploadedFileData,
  SerializedUploadThingError
>;

export class FileStruct extends Schema.Class<FileStruct>("FileStruct")({
  key: Schema.String,
  url: Schema.String,
  appUrl: Schema.String,
  fileHash: Schema.String,
  name: Schema.String,
  size: Schema.Number,
  type: Schema.String,
  lastModified: Schema.Number.pipe(Schema.optional),
  customId: Schema.NullOr(Schema.String),
}) {}

export class UploadResponse extends Schema.Class<UploadResponse>(
  "UploadResponse",
)({
  data: Schema.Array(FileStruct),
}) {}

export const UploadFilesCommand = Effect.fn("UploadFilesCommand")(function* <
  T extends UploadFileOptions | UploadFilesOptions,
>(options: T) {
  const files = "file" in options ? [options.file] : options.files;

  const result = yield* Effect.forEach(files, (file) =>
    uploadFile(file, options.contentDisposition, options.acl).pipe(
      Effect.match({
        onSuccess: (data) => ({ data, error: null }),
        onFailure: (error) => ({ data: null, error }),
      }),
    ),
  ).pipe(
    Effect.map((ups) => ("files" in options ? ups : ups[0]!)),
    Effect.tap((res) =>
      Effect.logDebug("Finished uploading").pipe(
        Effect.annotateLogs("uploadResult", res),
      ),
    ),
    Effect.withLogSpan("uploadFiles"),
  );

  return result as T extends UploadFileOptions
    ? UploadFileResult
    : UploadFileResult[];
});
