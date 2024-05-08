import * as S from "@effect/schema/Schema";
import * as Effect from "effect/Effect";

import {
  exponentialBackoff,
  fetchEff,
  generateUploadThingURL,
  isObject,
  parseResponseJson,
  RetryError,
  UploadThingError,
} from "@uploadthing/shared";
import type {
  ACL,
  ContentDisposition,
  Json,
  MaybeUrl,
  SerializedUploadThingError,
  Time,
  TimeShort,
} from "@uploadthing/shared";

import { uploadMultipart } from "../internal/multi-part.server";
import { uploadPresignedPost } from "../internal/presigned-post.server";
import {
  PollUploadResponseSchema,
  PresignedURLResponseSchema,
} from "../internal/shared-schemas";
import type { UploadedFileData } from "../types";
import type { FileEsque, UrlWithOverrides } from "./types";
import { UTFile } from "./ut-file";

export function guardServerOnly() {
  if (typeof window !== "undefined") {
    throw new UploadThingError({
      code: "INTERNAL_SERVER_ERROR",
      message: "The `utapi` can only be used on the server.",
    });
  }
}

type UploadFilesInternalOptions = {
  files: FileEsque[];
  metadata: Json;
  contentDisposition: ContentDisposition;
  acl: ACL | undefined;
};

export const uploadFilesInternal = (input: UploadFilesInternalOptions) =>
  getPresignedUrls(input).pipe(
    Effect.andThen((presigneds) =>
      Effect.forEach(
        presigneds,
        (file) =>
          uploadFile(file).pipe(
            Effect.match({
              onFailure: (error) => ({
                data: null,
                error: UploadThingError.toObject(
                  error instanceof UploadThingError
                    ? error
                    : new UploadThingError({
                        message: "Failed to upload file.",
                        code: "BAD_REQUEST",
                        cause: error,
                      }),
                ),
              }),
              onSuccess: (data: UploadedFileData) => ({ data, error: null }),
            }),
          ),
        { concurrency: 10 },
      ),
    ),
  );

/**
 * FIXME: downloading everything into memory and then upload
 * isn't the best. We should support streams so we can download
 * just as much as we need at any time.
 */
export const downloadFiles = (
  urls: (MaybeUrl | UrlWithOverrides)[],
  downloadErrors: Record<number, SerializedUploadThingError>,
) =>
  Effect.forEach(
    urls,
    (_url, idx) =>
      Effect.gen(function* () {
        let url = isObject(_url) ? _url.url : _url;
        if (typeof url === "string") {
          // since dataurls will result in name being too long, tell the user
          // to use uploadFiles instead.
          if (url.startsWith("data:")) {
            downloadErrors[idx] = UploadThingError.toObject(
              new UploadThingError({
                code: "BAD_REQUEST",
                message:
                  "Please use uploadFiles() for data URLs. uploadFilesFromUrl() is intended for use with remote URLs only.",
              }),
            );
            return null;
          }
        }
        url = new URL(url);

        const {
          name = url.pathname.split("/").pop() ?? "unknown-filename",
          customId = undefined,
        } = isObject(_url) ? _url : {};

        const response = yield* fetchEff(url);
        if (!response.ok) {
          downloadErrors[idx] = UploadThingError.toObject(
            new UploadThingError({
              code: "BAD_REQUEST",
              message: "Failed to download requested file.",
              cause: response,
            }),
          );
          return undefined;
        }

        return yield* Effect.promise(() => response.blob()).pipe(
          Effect.andThen((blob) => new UTFile([blob], name, { customId })),
        );
      }),
    { concurrency: 10 },
  );

const getPresignedUrls = (input: UploadFilesInternalOptions) =>
  Effect.gen(function* () {
    const { files, metadata, contentDisposition, acl } = input;

    const fileData = files.map((file) => ({
      name: file.name ?? "unnamed-blob",
      type: file.type,
      size: file.size,
      ...("customId" in file ? { customId: file.customId } : {}),
    }));
    yield* Effect.logDebug("Getting presigned URLs for files", fileData);

    const responseSchema = S.Struct({
      data: PresignedURLResponseSchema,
    });

    const presigneds = yield* fetchEff(
      generateUploadThingURL("/api/uploadFiles"),
      {
        method: "POST",
        cache: "no-store",
        body: JSON.stringify({
          files: fileData,
          metadata,
          contentDisposition,
          acl,
        }),
        headers: { "Content-Type": "application/json" },
      },
    ).pipe(
      Effect.andThen(parseResponseJson),
      Effect.andThen(S.decodeUnknown(responseSchema)),
      Effect.catchTag("ParseError", (e) => Effect.die(e)),
      Effect.catchTag("FetchError", (e) => Effect.die(e)),
    );
    yield* Effect.logDebug("Got presigned URLs:", presigneds.data);

    return files.map((file, i) => ({
      file,
      presigned: presigneds.data[i],
    }));
  });

const uploadFile = (
  input: Effect.Effect.Success<ReturnType<typeof getPresignedUrls>>[number],
) =>
  Effect.gen(function* () {
    const { file, presigned } = input;

    if ("urls" in presigned) {
      yield* uploadMultipart(file, presigned);
    } else {
      yield* uploadPresignedPost(file, presigned);
    }

    yield* fetchEff(
      generateUploadThingURL(`/api/pollUpload/${presigned.key}`),
    ).pipe(
      Effect.andThen(parseResponseJson),
      Effect.andThen(S.decodeUnknown(PollUploadResponseSchema)),
      Effect.tap(Effect.logDebug("Polled upload", presigned.key)),
      Effect.andThen((res) =>
        res.status === "done"
          ? Effect.succeed(undefined)
          : Effect.fail(new RetryError()),
      ),
      Effect.retry({
        while: (err) => err instanceof RetryError,
        schedule: exponentialBackoff,
      }),
      Effect.catchTag("RetryError", (e) => Effect.die(e)),
    );

    return {
      key: presigned.key,
      url: presigned.fileUrl,
      name: file.name,
      size: file.size,
      type: file.type,
      customId: "customId" in file ? file.customId ?? null : null,
    };
  });

export function parseTimeToSeconds(time: Time) {
  const match = time.toString().split(/(\d+)/).filter(Boolean);
  const num = Number(match[0]);
  const unit = (match[1] ?? "s").trim().slice(0, 1) as TimeShort;

  const multiplier = {
    s: 1,
    m: 60,
    h: 3600,
    d: 86400,
  }[unit];

  return num * multiplier;
}
