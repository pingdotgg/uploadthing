/**
 * These are imported to make TypeScript aware of the types.
 * It's having a hard time resolving deeply nested stuff from transitive dependencies.
 * You'll notice if you need to add more imports if you get build errors like:
 * `The type of X cannot be inferred without a reference to <MODULE>`
 */
import "@effect/schema/ParseResult";
import "effect/Cause";

import * as S from "@effect/schema/Schema";
import { Effect, pipe } from "effect";
import { process } from "std-env";
import type { File as UndiciFile } from "undici";

import {
  exponentialBackoff,
  fetchContext,
  fetchEff,
  fetchEffJson,
  generateUploadThingURL,
  UploadThingError,
} from "@uploadthing/shared";
import type {
  ACL,
  ContentDisposition,
  Json,
  MaybeUrl,
} from "@uploadthing/shared";

import { mpuSchema, pspSchema } from "../internal/handler";
import type { MPUResponse, PSPResponse } from "../internal/handler";
import { logger } from "../internal/logger";
import { uploadPart } from "../internal/multi-part";

export function guardServerOnly() {
  if (typeof window !== "undefined") {
    throw new UploadThingError({
      code: "INTERNAL_SERVER_ERROR",
      message: "The `utapi` can only be used on the server.",
    });
  }
}

export function getApiKeyOrThrow(apiKey?: string) {
  if (apiKey) return apiKey;
  if (process.env.UPLOADTHING_SECRET) return process.env.UPLOADTHING_SECRET;

  throw new UploadThingError({
    code: "MISSING_ENV",
    message: "Missing `UPLOADTHING_SECRET` env variable.",
  });
}

export type FileEsque =
  | (Blob & { name: string; customId?: string })
  | UndiciFile;

export function uploadFilesInternal(
  input: Parameters<typeof getPresignedUrls>[0],
) {
  return pipe(
    getPresignedUrls(input),
    Effect.andThen((presigneds) =>
      // TODO: Catch errors for each file and return data like
      // ({ data, error: null } | { data: null, error })[]
      Effect.all(presigneds.map(uploadFile), { concurrency: 10 }),
    ),
  );
}

/**
 * FIXME: downloading everything into memory and then upload
 * isn't the best. We should support streams so we can download
 * just as much as we need at any time.
 */
export function downloadFiles(urls: MaybeUrl[]) {
  return Effect.gen(function* ($) {
    const context = yield* $(fetchContext);

    const downloads = urls.map((url) =>
      pipe(
        fetchEff(context.fetch, url),
        Effect.andThen((r) => r.blob()),
        Effect.andThen((blob) => {
          const name = url.toString().split("/").pop();
          return Object.assign(blob, { name: name ?? "unknown-filename" });
        }),
      ),
    );

    return yield* $(Effect.all(downloads, { concurrency: 10 }));
  });
}

function getPresignedUrls(input: {
  files: FileEsque[];
  metadata: Json;
  contentDisposition: ContentDisposition;
  acl?: ACL;
}) {
  return Effect.gen(function* ($) {
    const { files, metadata, contentDisposition, acl } = input;
    const context = yield* $(fetchContext);

    const fileData = files.map((file) => ({
      name: file.name ?? "unnamed-blob",
      type: file.type,
      size: file.size,
      ...("customId" in file ? { customId: file.customId } : {}),
    }));
    logger.debug("Getting presigned URLs for files", fileData);

    const responseSchema = S.struct({
      data: S.array(S.union(mpuSchema, pspSchema)),
    });

    const presigneds = yield* $(
      fetchEffJson(
        context.fetch,
        responseSchema,
        generateUploadThingURL("/api/uploadFiles"),
        {
          method: "POST",
          headers: context.utRequestHeaders,
          cache: "no-store",
          body: JSON.stringify({
            files: fileData,
            metadata,
            contentDisposition,
            acl,
          }),
        },
      ),
    );
    logger.debug("Got presigned URLs:", presigneds.data);

    return files.map((file, i) => ({
      file,
      presigned: presigneds.data[i],
    }));
  });
}

function uploadFile(
  input: Effect.Effect.Success<ReturnType<typeof getPresignedUrls>>[number],
) {
  return Effect.gen(function* ($) {
    const context = yield* $(fetchContext);
    const { file, presigned } = input;

    if ("urls" in presigned) {
      yield* $(uploadMultipart(file, presigned));
    } else {
      yield* $(uploadPresignedPost(file, presigned));
    }

    yield* $(
      fetchEffJson(
        context.fetch,
        S.struct({ status: S.string }),
        generateUploadThingURL(`/api/pollUpload/${presigned.key}`),
        { headers: context.utRequestHeaders },
      ),
      Effect.andThen((res) =>
        res.status === "done"
          ? Effect.succeed(undefined)
          : Effect.fail({ _tag: "NotDone" as const }),
      ),
      Effect.retry({
        while: (err) => err._tag === "NotDone",
        schedule: exponentialBackoff,
      }),
    );

    return {
      key: presigned.key,
      url: presigned.fileUrl,
      name: file.name,
      size: file.size,
    };
  });
}

function uploadMultipart(file: FileEsque, presigned: MPUResponse) {
  logger.debug(
    "Uploading file",
    file.name,
    "with",
    presigned.urls.length,
    "chunks of size",
    presigned.chunkSize,
    "bytes each",
  );

  return Effect.gen(function* ($) {
    const etags = yield* $(
      Effect.all(
        presigned.urls.map((url, index) => {
          const offset = presigned.chunkSize * index;
          const end = Math.min(offset + presigned.chunkSize, file.size);
          const chunk = file.slice(offset, end);

          return pipe(
            uploadPart({
              url,
              chunk: chunk as Blob,
              contentDisposition: presigned.contentDisposition,
              contentType: file.type,
              fileName: file.name,
              maxRetries: 10,
              key: presigned.key,
            }),
            Effect.andThen((etag) => ({ tag: etag, partNumber: index + 1 })),
          );
        }),
        { concurrency: "inherit" },
      ),
    );

    logger.debug("File", file.name, "uploaded successfully.");
    logger.debug("Comleting multipart upload...");
    yield* $(completeUpload(presigned, etags));
    logger.debug("Multipart upload complete.");
  });
}

function completeUpload(
  presigned: { key: string; uploadId: string },
  etags: { tag: string; partNumber: number }[],
) {
  return Effect.gen(function* ($) {
    const context = yield* $(fetchContext);

    yield* $(
      fetchEff(
        context.fetch,
        generateUploadThingURL("/api/completeMultipart"),
        {
          method: "POST",
          body: JSON.stringify({
            fileKey: presigned.key,
            uploadId: presigned.uploadId,
            etags,
          }),
          headers: context.utRequestHeaders,
        },
      ),
    );
  });
}

function uploadPresignedPost(file: FileEsque, presigned: PSPResponse) {
  logger.debug("Uploading file", file.name, "using presigned POST URL");

  return Effect.gen(function* ($) {
    const context = yield* $(fetchContext);

    const formData = new FormData();
    Object.entries(presigned.fields).forEach(([k, v]) => formData.append(k, v));
    formData.append("file", file as Blob); // File data **MUST GO LAST**

    const res = yield* $(
      fetchEff(context.fetch, presigned.url, {
        method: "POST",
        body: formData,
        headers: new Headers({
          Accept: "application/xml",
        }),
      }),
    );

    if (!res.ok) {
      const text = yield* $(Effect.promise(() => res.text()));
      logger.error("Failed to upload file:", text);
      throw new UploadThingError({
        code: "UPLOAD_FAILED",
        message: "Failed to upload file",
        cause: text,
      });
    }

    logger.debug("File", file.name, "uploaded successfully");
  });
}

type TimeShort = "s" | "m" | "h" | "d";
type TimeLong = "second" | "minute" | "hour" | "day";
type SuggestedNumbers = 2 | 3 | 4 | 5 | 6 | 7 | 10 | 15 | 30 | 60;
// eslint-disable-next-line @typescript-eslint/ban-types
type AutoCompleteableNumber = SuggestedNumbers | (number & {});
export type Time =
  | number
  | `1${TimeShort}`
  | `${AutoCompleteableNumber}${TimeShort}`
  | `1 ${TimeLong}`
  | `${AutoCompleteableNumber} ${TimeLong}s`;

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
