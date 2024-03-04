import * as S from "@effect/schema/Schema";
import { Effect } from "effect";

import type { FetchContextTag } from "@uploadthing/shared";
import {
  fetchEff,
  parseResponseJson,
  UploadThingError,
} from "@uploadthing/shared";

import { UPLOADTHING_VERSION } from "./constants";
import { maybeParseResponseXML } from "./s3-error-parser";
import type {
  FailureActionPayload,
  MultipartCompleteActionPayload,
  UploadActionPayload,
} from "./shared-schemas";
import type { ActionType, PresignedURLs } from "./types";

type UTEvents = {
  upload: { in: S.Schema.To<typeof UploadActionPayload>; out: PresignedURLs };
  failure: { in: S.Schema.To<typeof FailureActionPayload>; out: null };
  "multipart-complete": {
    in: S.Schema.To<typeof MultipartCompleteActionPayload>;
    out: null;
  };
};

const createAPIRequestUrl = (config: {
  /**
   * URL to the UploadThing API endpoint
   * @example URL { /api/uploadthing }
   * @example URL { https://www.example.com/api/uploadthing }
   */
  url: URL;
  slug: string;
  actionType: ActionType;
}) => {
  const url = new URL(config.url);

  const queryParams = new URLSearchParams(url.search);
  queryParams.set("actionType", config.actionType);
  queryParams.set("slug", config.slug);

  url.search = queryParams.toString();
  return url;
};

export type UTReporter = <TEvent extends keyof UTEvents>(
  type: TEvent,
  payload: UTEvents[TEvent]["in"],
) => Effect.Effect<UTEvents[TEvent]["out"], UploadThingError, FetchContextTag>;

/**
 * Creates a "client" for reporting events to the UploadThing server via the user's API endpoint.
 * Events are handled in "./handler.ts starting at L200"
 */
export const createUTReporter =
  (cfg: { url: URL; endpoint: string; package: string }): UTReporter =>
  (type, payload) =>
    Effect.gen(function* ($) {
      const url = createAPIRequestUrl({
        url: cfg.url,
        slug: cfg.endpoint,
        actionType: type,
      });
      const response = yield* $(
        fetchEff(url, {
          method: "POST",
          body: JSON.stringify(payload),
          headers: {
            "Content-Type": "application/json",
            "x-uploadthing-package": cfg.package,
            "x-uploadthing-version": UPLOADTHING_VERSION,
          },
        }),
        Effect.catchTag("FetchError", (e) =>
          Effect.fail(
            new UploadThingError({
              code: "INTERNAL_CLIENT_ERROR",
              message: "Failed to report event to UploadThing server",
              cause: e,
            }),
          ),
        ),
      );

      switch (type) {
        case "failure": {
          // why isn't this narrowed automatically?
          const p = payload as UTEvents["failure"]["in"];
          const parsed = maybeParseResponseXML(p.s3Error ?? "");
          if (parsed?.message) {
            return yield* $(
              new UploadThingError({
                code: parsed.code,
                message: parsed.message,
              }),
            );
          } else {
            return yield* $(
              new UploadThingError({
                code: "UPLOAD_FAILED",
                message: `Failed to upload file ${p.fileName} to S3`,
                cause: p.s3Error,
              }),
            );
          }
        }
      }

      if (!response.ok) {
        return yield* $(
          new UploadThingError({
            code: "BAD_REQUEST",
            message: response.statusText,
            cause: response,
          }),
        );
      }

      const jsonOrError = yield* $(
        parseResponseJson(
          response,
          S.any as S.Schema<UTEvents[typeof type]["out"]>,
        ),
        Effect.catchTag("ParseError", (e) =>
          Effect.fail(
            new UploadThingError({
              code: "INTERNAL_CLIENT_ERROR",
              message: "Failed to report event to UploadThing server",
              cause: e,
            }),
          ),
        ),
      );

      return jsonOrError;
    });
