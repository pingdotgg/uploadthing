import * as S from "@effect/schema/Schema";
import * as Duration from "effect/Duration";
import * as Effect from "effect/Effect";
import * as Schedule from "effect/Schedule";

import {
  fetchEff,
  generateUploadThingURL,
  parseResponseJson,
  RetryError,
  signPayload,
  UploadThingError,
} from "@uploadthing/shared";
import type { ResponseEsque } from "@uploadthing/shared";

import { PollUploadResponse, UploadedFileData } from "./shared-schemas";

const isValidResponse = (response: ResponseEsque) => {
  if (!response.ok) return false;
  if (response.status >= 400) return false;
  if (!response.headers.has("x-uploadthing-version")) return false;

  return true;
};

export const conditionalDevServer = (fileKey: string, apiKey: string) => {
  return Effect.gen(function* () {
    const file = yield* fetchEff(
      generateUploadThingURL(`/v6/pollUpload/${fileKey}`),
    ).pipe(
      Effect.andThen(parseResponseJson),
      Effect.andThen(S.decodeUnknown(PollUploadResponse)),
      Effect.andThen((res) =>
        res.status === "done" && res.fileData
          ? Effect.succeed(res.fileData)
          : Effect.fail(new RetryError()),
      ),
      Effect.retry({
        while: (err) => err instanceof RetryError,
        schedule: Schedule.exponential(10, 4).pipe(
          // 10ms, 40ms, 160ms, 640ms...
          Schedule.union(Schedule.spaced(1000)),
          Schedule.compose(Schedule.elapsed),
          Schedule.whileOutput(Duration.lessThanOrEqualTo(Duration.minutes(1))),
        ),
      }),
      Effect.catchTag(
        "RetryError",
        () =>
          new UploadThingError({
            code: "UPLOAD_FAILED",
            message: "File took too long to upload",
          }),
      ),
    );

    let callbackUrl = file.callbackUrl + `?slug=${file.callbackSlug}`;
    if (!callbackUrl.startsWith("http")) callbackUrl = "http://" + callbackUrl;

    yield* Effect.logInfo(
      `SIMULATING FILE UPLOAD WEBHOOK CALLBACK`,
      callbackUrl,
    );

    const payload = JSON.stringify({
      status: "uploaded",
      metadata: JSON.parse(file.metadata ?? "{}") as unknown,
      file: new UploadedFileData({
        url: `https://utfs.io/f/${encodeURIComponent(fileKey)}`,
        key: fileKey,
        name: file.fileName,
        size: file.fileSize,
        customId: file.customId,
        type: file.fileType,
      }),
    });

    const signature = yield* Effect.tryPromise({
      try: () => signPayload(payload, apiKey),
      catch: (e) =>
        new UploadThingError({
          code: "INTERNAL_SERVER_ERROR",
          message: "Failed to sign payload",
          cause: e,
        }),
    });

    const callbackResponse = yield* fetchEff(callbackUrl, {
      method: "POST",
      body: payload,
      headers: {
        "Content-Type": "application/json",
        "uploadthing-hook": "callback",
        "x-uploadthing-signature": signature,
      },
    }).pipe(
      Effect.catchTag("FetchError", () =>
        Effect.succeed(new Response(null, { status: 500 })),
      ),
    );

    if (isValidResponse(callbackResponse)) {
      yield* Effect.logInfo(
        "Successfully simulated callback for file",
        fileKey,
      );
    } else {
      yield* Effect.logError(
        `
Failed to simulate callback for file '${file.fileKey}'. Is your webhook configured correctly?
  - Make sure the URL '${callbackUrl}' is accessible without any authentication. You can verify this by running 'curl -X POST ${callbackUrl}' in your terminal
  - Still facing issues? Read https://docs.uploadthing.com/faq for common issues
`.trim(),
      );
    }
    return file;
  });
};
