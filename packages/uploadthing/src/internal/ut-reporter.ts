import type * as S from "@effect/schema/Schema";
import { Effect } from "effect";

import type { FetchContextTag } from "@uploadthing/shared";
import { fetchEffJson, UploadThingError } from "@uploadthing/shared";

import { UPLOADTHING_VERSION } from "./constants";
import { maybeParseResponseXML } from "./s3-error-parser";
import type { ActionType, UTEvents } from "./types";

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
  responseSchema: S.Schema<UTEvents[TEvent]["out"]>,
) => Effect.Effect<UTEvents[TEvent]["out"], UploadThingError, FetchContextTag>;

/**
 * Creates a "client" for reporting events to the UploadThing server via the user's API endpoint.
 * Events are handled in "./handler.ts starting at L200"
 */
export const createUTReporter =
  (cfg: { url: URL; endpoint: string; package: string }): UTReporter =>
  (type, payload, responseSchema) =>
    Effect.gen(function* ($) {
      const url = createAPIRequestUrl({
        url: cfg.url,
        slug: cfg.endpoint,
        actionType: type,
      });
      const response = yield* $(
        fetchEffJson(url, responseSchema, {
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
        Effect.catchTag("ParseError", (e) =>
          Effect.fail(
            new UploadThingError({
              code: "INTERNAL_CLIENT_ERROR",
              message: "Failed to parse response from UploadThing server",
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

      return response;
    });
