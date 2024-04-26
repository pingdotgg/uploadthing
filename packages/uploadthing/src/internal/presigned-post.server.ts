import { Effect } from "effect";

import {
  fetchEff,
  fetchEffJson,
  generateUploadThingURL,
  UploadThingError,
} from "@uploadthing/shared";

import type { FileEsque } from "../sdk/types";
import { FailureCallbackResponseSchema } from "./shared-schemas";
import type { PSPResponse } from "./types";

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
        fetchEffJson(
          generateUploadThingURL("/api/failureCallback"),
          FailureCallbackResponseSchema,
          {
            method: "POST",
            body: JSON.stringify({
              fileKey: presigned.key,
              uploadId: null,
            }),
            headers: { "Content-Type": "application/json" },
          },
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
