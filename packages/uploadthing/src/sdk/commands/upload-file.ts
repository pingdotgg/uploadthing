import { Effect, Schema, Stream } from "effect";

import {
  generateKey,
  generateSignedURL,
  UploadThingError,
} from "@uploadthing/shared";
import type {
  ACL,
  ContentDisposition,
  Either,
  FileProperties,
  ResponseEsque,
  SerializedUploadThingError,
} from "@uploadthing/shared";

import { IngestUrl, UTToken } from "../../_internal/config";
import { UploadedFileData } from "../../_internal/shared-schemas";
import { uploadWithoutProgress } from "../../_internal/upload-server";

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
   * The file content to upload. Can be:
   * - A Response from fetch()
   * - A File object
   * - A Blob object
   * - A ReadableStream
   * - A Buffer
   */
  body: ResponseEsque | File | Blob | ReadableStream | Buffer;
  /**
   * The name of the file. Required if body is not a File object.
   */
  name?: string | undefined;
  /**
   * Optional custom ID for the file
   */
  customId?: string | null | undefined;
}

export type FileEsque = File & {
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

export const UploadFileCommand = Effect.fn("UploadFileCommand")(function* <
  T extends UploadFileOptions,
>(options: T) {
  const { properties, stream } = normalizeUploadInput(options);

  const presigned = yield* generatePresignedUrl(
    properties,
    options.contentDisposition ?? "inline",
    options.acl,
  ).pipe(
    Effect.catchTag(
      "ConfigError",
      () =>
        new UploadThingError({
          code: "INVALID_SERVER_CONFIG",
          message: "Failed to generate presigned URL",
        }),
    ),
  );

  const result = yield* uploadWithoutProgress(stream, presigned).pipe(
    Effect.map((data) =>
      UploadedFileData.make({
        name: properties.name,
        size: properties.size,
        type: properties.type,
        lastModified: properties.lastModified,
        customId: properties.customId ?? null,
        key: presigned.key,
        url: data.url,
        appUrl: data.appUrl,
        fileHash: data.fileHash,
      }),
    ),
    Effect.catchTag(
      "ResponseError",
      (err) =>
        new UploadThingError({
          code: "UPLOAD_FAILED",
          message: "Failed to upload file",
          cause: err,
        }),
    ),
  );

  return result;
});

const normalizeUploadInput = function (input: UploadFileOptions): {
  properties: FileProperties & { customId?: string | null | undefined };
  stream: Stream.Stream<Uint8Array, unknown>;
} {
  const { body, name, customId } = input;

  if (body instanceof File) {
    const properties = {
      size: body.size,
      type: body.type,
      lastModified: body.lastModified,
      name: name ?? body.name,
      customId,
    };

    return {
      properties: properties,
      stream: Stream.fromReadableStream(
        () => body.stream(),
        () => console.error("Could not read stream"),
      ),
    };
  }

  if (!name) {
    throw new Error("name is required when body is not a File object");
  }

  if (body instanceof Blob) {
    return {
      properties: {
        name,
        size: body.size,
        type: body.type,
        lastModified: Date.now(),
        customId,
      },
      stream: Stream.fromReadableStream(
        () => body.stream(),
        () => console.error("Could not read stream"),
      ),
    };
  }

  if (body instanceof Response && body.body) {
    return {
      properties: {
        name,
        size: Number(body.headers.get("content-length") ?? 0),
        type: body.headers.get("content-type") ?? "application/octet-stream",
        lastModified: Date.now(),
        customId,
      },
      stream: Stream.fromReadableStream(
        () => body.body!,
        () => console.error("Could not read stream"),
      ),
    };
  }

  throw new Error("Invalid input");
};

const generatePresignedUrl = Effect.fn("generatePresignedUrl")(function* (
  properties: FileProperties & { customId?: string | null | undefined },
  cd: ContentDisposition,
  acl: ACL | undefined,
) {
  const { apiKey, appId } = yield* UTToken;
  const baseUrl = yield* IngestUrl;

  const key = yield* generateKey(properties, appId);

  const url = yield* generateSignedURL(`${baseUrl}/${key}`, apiKey, {
    // ttlInSeconds: routeOptions.presignedURLTTL,
    data: {
      "x-ut-identifier": appId,
      "x-ut-file-name": properties.name,
      "x-ut-file-size": properties.size,
      "x-ut-file-type": properties.type,
      "x-ut-custom-id": properties.customId,
      "x-ut-content-disposition": cd,
      "x-ut-acl": acl,
    },
  });
  return { url, key };
});
