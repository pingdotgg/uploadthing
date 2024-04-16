import * as S from "@effect/schema/Schema";
import { Effect } from "effect";

import {
  exponentialBackoff,
  fetchEff,
  fetchEffJson,
  generateUploadThingURL,
  RetryError,
  signPayload,
  UploadThingError,
} from "@uploadthing/shared";
import type { ResponseEsque } from "@uploadthing/shared";

import { logger } from "./logger";
import type { UploadedFileData } from "./shared-schemas";

const isValidResponse = (response: ResponseEsque) => {
  if (!response.ok) return false;
  if (response.status >= 400) return false;
  if (!response.headers.has("x-uploadthing-version")) return false;

  return true;
};

export const conditionalDevServer = (fileKey: string, apiKey: string) => {
  return Effect.gen(function* ($) {
    const file = yield* $(
      fetchEffJson(
        generateUploadThingURL(`/api/pollUpload/${fileKey}`),
        S.Struct({
          status: S.String,
          fileData: S.optional(
            S.Struct({
              fileKey: S.NullOr(S.String),
              fileName: S.String,
              fileSize: S.Number,
              fileType: S.String,
              metadata: S.NullOr(S.String),
              customId: S.NullOr(S.String),

              callbackUrl: S.String,
              callbackSlug: S.String,
            }),
          ),
        }),
      ),
      Effect.andThen((res) =>
        res.status === "done"
          ? Effect.succeed(res.fileData)
          : Effect.fail(new RetryError()),
      ),
      Effect.retry({
        while: (err) => err instanceof RetryError,
        schedule: exponentialBackoff,
      }),
      Effect.catchTag("RetryError", (e) => Effect.die(e)),
    );

    if (file === undefined) {
      logger.error(`Failed to simulate callback for file ${fileKey}`);
      return yield* $(
        new UploadThingError({
          code: "UPLOAD_FAILED",
          message: "File took too long to upload",
        }),
      );
    }

    let callbackUrl = file.callbackUrl + `?slug=${file.callbackSlug}`;
    if (!callbackUrl.startsWith("http")) callbackUrl = "http://" + callbackUrl;

    logger.info("SIMULATING FILE UPLOAD WEBHOOK CALLBACK", callbackUrl);

    const payload = JSON.stringify({
      status: "uploaded",
      metadata: JSON.parse(file.metadata ?? "{}") as unknown,
      file: {
        url: `https://utfs.io/f/${encodeURIComponent(fileKey)}`,
        key: fileKey,
        name: file.fileName,
        size: file.fileSize,
        customId: file.customId,
        type: file.fileType,
      } satisfies UploadedFileData,
    });

    const signature = yield* $(
      Effect.tryPromise({
        try: () => signPayload(payload, apiKey),
        catch: (e) =>
          new UploadThingError({
            code: "INTERNAL_SERVER_ERROR",
            message: "Failed to sign payload",
            cause: e,
          }),
      }),
    );

    const callbackResponse = yield* $(
      fetchEff(callbackUrl, {
        method: "POST",
        body: payload,
        headers: {
          "Content-Type": "application/json",
          "uploadthing-hook": "callback",
          "x-uploadthing-signature": signature,
        },
      }),
      Effect.catchTag("FetchError", () =>
        Effect.succeed(new Response(null, { status: 500 })),
      ),
    );

    if (isValidResponse(callbackResponse)) {
      logger.success("Successfully simulated callback for file", fileKey);
    } else {
      logger.error(
        `Failed to simulate callback for file '${file.fileKey}'. Is your webhook configured correctly?`,
      );
      logger.error(
        `  - Make sure the URL '${callbackUrl}' is accessible without any authentication. You can verify this by running 'curl -X POST ${callbackUrl}' in your terminal`,
      );
      logger.error(
        `  - Still facing issues? Read https://docs.uploadthing.com/faq for common issues`,
      );
    }
    return file;
  });
};
