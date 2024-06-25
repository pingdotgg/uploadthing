import * as S from "@effect/schema/Schema";
import * as Effect from "effect/Effect";
import { unsafeCoerce } from "effect/Function";

import {
  fetchEff,
  generateUploadThingURL,
  parseResponseJson,
  UploadThingError,
} from "@uploadthing/shared";

import type { FileEsque } from "../sdk/types";
import { FailureCallbackResponse } from "./shared-schemas";

export const uploadWithoutProgress = (
  file: FileEsque,
  presigned: { key: string; url: string },
) =>
  Effect.gen(function* () {
    const formData = new FormData();
    formData.append("file", file as Blob); // File data **MUST GO LAST**

    const res = yield* fetchEff(presigned.url, {
      method: "PUT",
      body: formData,
      headers: new Headers({
        Accept: "application/xml",
        Range: `bytes=0-`,
      }),
    }).pipe(
      Effect.tapErrorCause(() =>
        fetchEff(generateUploadThingURL("/v6/failureCallback"), {
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

    const json = yield* parseResponseJson(res).pipe(
      Effect.andThen(unsafeCoerce<unknown, { url: string }>),
    );
    yield* Effect.logDebug("File", file.name, "uploaded successfully:", json);
    return json;
  });
