import * as S from "@effect/schema/Schema";
import * as Effect from "effect/Effect";

import {
  fetchEff,
  generateUploadThingURL,
  parseResponseJson,
  UploadThingError,
} from "@uploadthing/shared";

import type { FileEsque } from "../sdk/types";
import type { PSPResponse } from "./shared-schemas";
import { FailureCallbackResponse } from "./shared-schemas";

export const uploadPresignedPost = (file: FileEsque, presigned: PSPResponse) =>
  Effect.gen(function* () {
    yield* Effect.logDebug(
      `Uploading file ${file.name} using presigned POST URL`,
    );
    const formData = new FormData();
    Object.entries(presigned.fields).forEach(([k, v]) => formData.append(k, v));
    formData.append("file", file as Blob); // File data **MUST GO LAST**

    const res = yield* fetchEff(presigned.url, {
      method: "POST",
      body: formData,
      headers: new Headers({
        Accept: "application/xml",
      }),
    }).pipe(
      Effect.tapErrorCause(() =>
        fetchEff(generateUploadThingURL("/api/failureCallback"), {
          method: "POST",
          body: JSON.stringify({
            fileKey: presigned.key,
            uploadId: null,
          }),
          headers: { "Content-Type": "application/json" },
        }).pipe(
          Effect.andThen(parseResponseJson),
          Effect.andThen(S.decodeUnknown(FailureCallbackResponse)),
        ),
      ),
    );

    if (!res.ok) {
      const text = yield* Effect.promise(res.text);
      yield* Effect.logError(
        `Failed to upload file ${file.name} to presigned POST URL. Response: ${text}`,
      );
      return yield* new UploadThingError({
        code: "UPLOAD_FAILED",
        message: "Failed to upload file",
        cause: text,
      });
    }

    yield* Effect.logDebug("File", file.name, "uploaded successfully");
  });
