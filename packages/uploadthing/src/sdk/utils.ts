import { Schema as S } from "@effect/schema";
import { Context, Effect, pipe } from "effect";
import { process } from "std-env";
import type { File as UndiciFile } from "undici";

import {
  exponentialBackoff,
  fetchEff,
  fetchEffJson,
  generateUploadThingURL,
  UploadThingError,
} from "@uploadthing/shared";
import type {
  ACL,
  ContentDisposition,
  EffectValue,
  FetchEsque,
  Json,
  MaybeUrl,
} from "@uploadthing/shared";

import { logger } from "../internal/logger";
import { uploadPart } from "../internal/multi-part";

export type FileEsque = (Blob & { name: string }) | UndiciFile;

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

export const Goodies = Context.Tag<{
  fetch: FetchEsque;
  utRequestHeaders: Record<string, string>;
}>("Goodies");

export function uploadFilesInternal(
  input: Parameters<typeof getPresignedUrls>[0],
) {
  return pipe(
    input,
    getPresignedUrls,
    Effect.andThen((presigneds) =>
      // TODO: Catch errors for each file and return data like
      // ({ data, error: null } | { data: null, error })[]
      Effect.all(presigneds.map(uploadFile), { concurrency: 10 }),
    ),
  );
}

export function downloadFiles(urls: MaybeUrl[]) {
  return Effect.gen(function* ($) {
    const goodies = yield* $(Goodies);

    const downloads = urls.map((url) =>
      pipe(
        url,
        (url) => fetchEff(goodies.fetch, url),
        Effect.andThen((r) => r.blob()),
        Effect.andThen((b) => {
          const name = url.toString().split("/").pop();
          return Object.assign(b, { name: name ?? "unknown-filename" });
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
    const goodies = yield* $(Goodies);

    const fileData = files.map((file) => ({
      name: file.name ?? "unnamed-blob",
      type: file.type,
      size: file.size,
    }));
    logger.debug("Getting presigned URLs for files", fileData);

    const responseSchema = S.struct({
      data: S.array(
        S.struct({
          presignedUrls: S.array(S.string),
          key: S.string,
          fileUrl: S.string,
          fileType: S.string,
          uploadId: S.string,
          chunkSize: S.number,
          chunkCount: S.number,
        }),
      ),
    });

    const presigneds = yield* $(
      fetchEffJson(
        goodies.fetch,
        responseSchema,
        generateUploadThingURL("/api/uploadFiles"),
        {
          method: "POST",
          headers: goodies.utRequestHeaders,
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
      contentDisposition,
    }));
  });
}

function uploadFile(
  input: EffectValue<ReturnType<typeof getPresignedUrls>>[number],
) {
  return Effect.gen(function* ($) {
    const { file, presigned, contentDisposition } = input;
    const goodies = yield* $(Goodies);

    logger.debug(
      "Uploading file",
      file.name,
      "with",
      presigned.presignedUrls.length,
      "chunks of size",
      presigned.chunkSize,
      "bytes each",
    );

    const etags = yield* $(
      Effect.all(
        presigned.presignedUrls.map((url, index) => {
          const offset = presigned.chunkSize * index;
          const end = Math.min(offset + presigned.chunkSize, file.size);
          const chunk = file.slice(offset, end);

          return pipe(
            Effect.promise(() =>
              uploadPart({
                fetch: goodies.fetch,
                url,
                chunk: chunk as Blob,
                contentDisposition,
                contentType: file.type,
                fileName: file.name,
                maxRetries: 10,
                key: presigned.key,
                utRequestHeaders: goodies.utRequestHeaders,
              }),
            ),
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

    return {
      key: presigned.key,
      url: presigned.fileUrl,
      name: file.name,
      size: file.size,
    };
  });
}

function completeUpload(
  presigned: { key: string; uploadId: string },
  etags: { tag: string; partNumber: number }[],
) {
  return Effect.gen(function* ($) {
    const goodies = yield* $(Goodies);

    yield* $(
      fetchEff(
        goodies.fetch,
        generateUploadThingURL("/api/completeMultipart"),
        {
          method: "POST",
          body: JSON.stringify({
            fileKey: presigned.key,
            uploadId: presigned.uploadId,
            etags,
          }),
          headers: goodies.utRequestHeaders,
        },
      ),
    );

    yield* $(
      fetchEffJson(
        goodies.fetch,
        S.struct({ status: S.string }),
        generateUploadThingURL(`/api/pollUpload/${presigned.key}`),
        { headers: goodies.utRequestHeaders },
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
