import type * as S from "@effect/schema/Schema";
import * as Effect from "effect/Effect";

import type { FetchContext, MaybePromise } from "@uploadthing/shared";
import {
  fetchEffJson,
  getErrorTypeFromStatusCode,
  isObject,
  UploadThingError,
} from "@uploadthing/shared";

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
) => Effect.Effect<UTEvents[TEvent]["out"], UploadThingError, FetchContext>;

/**
 * Creates a "client" for reporting events to the UploadThing server via the user's API endpoint.
 * Events are handled in "./handler.ts starting at L112"
 */
export const createUTReporter =
  (cfg: {
    url: URL;
    endpoint: string;
    package: string;
    headers: HeadersInit | (() => MaybePromise<HeadersInit>) | undefined;
  }): UTReporter =>
  (type, payload, responseSchema) =>
    Effect.gen(function* () {
      const url = createAPIRequestUrl({
        url: cfg.url,
        slug: cfg.endpoint,
        actionType: type,
      });
      let headers =
        typeof cfg.headers === "function" ? cfg.headers() : cfg.headers;
      if (headers instanceof Promise) {
        headers = yield* Effect.promise(() => headers as Promise<HeadersInit>);
      }

      const response = yield* fetchEffJson(url, responseSchema, {
        method: "POST",
        body: JSON.stringify(payload),
        headers: {
          "Content-Type": "application/json",
          "x-uploadthing-package": cfg.package,
          "x-uploadthing-version": UPLOADTHING_VERSION,
          ...headers,
        },
      }).pipe(
        Effect.catchTag("BadRequestError", (e) =>
          Effect.fail(
            new UploadThingError({
              code: getErrorTypeFromStatusCode(e.status),
              message:
                isObject(e.error) && typeof e.error.message === "string"
                  ? e.error.message
                  : e.message,
              cause: e.error,
            }),
          ),
        ),
        Effect.catchTag("FetchError", (e) =>
          Effect.fail(
            new UploadThingError({
              code: "INTERNAL_CLIENT_ERROR",
              message: `Failed to report event "${type}" to UploadThing server`,
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
          const parsed = maybeParseResponseXML(p.storageProviderError ?? "");
          if (parsed?.message) {
            return yield* new UploadThingError({
              code: parsed.code,
              message: parsed.message,
            });
          } else {
            return yield* new UploadThingError({
              code: "UPLOAD_FAILED",
              message: `Failed to upload file ${p.fileName} to S3`,
              cause: p.storageProviderError,
            });
          }
        }
      }

      return response;
    });
