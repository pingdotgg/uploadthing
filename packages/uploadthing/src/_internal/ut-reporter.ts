import { unsafeCoerce } from "effect/Function";
import * as Micro from "effect/Micro";

import type { FetchContext, MaybePromise } from "@uploadthing/shared";
import {
  fetchEff,
  getErrorTypeFromStatusCode,
  parseResponseJson,
  UploadThingError,
} from "@uploadthing/shared";

import * as pkgJson from "../../package.json";
import type { TraceHeaders } from "./random-hex";
import type { ActionType } from "./shared-schemas";
import type { UTEvents } from "./types";

const createAPIRequestUrl = (config: {
  /**
   * URL to the UploadThing API endpoint
   * @example URL { /api/uploadthing }
   * @example URL { https://www.example.com/api/uploadthing }
   */
  url: URL;
  slug: string;
  actionType: typeof ActionType.Type;
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
) => Micro.Micro<UTEvents[TEvent]["out"], UploadThingError, FetchContext>;

/**
 * Creates a "client" for reporting events to the UploadThing server via the user's API endpoint.
 * Events are handled in "./handler.ts starting at L112"
 */
export const createUTReporter =
  (cfg: {
    url: URL;
    endpoint: string;
    package?: string | undefined;
    headers: HeadersInit | (() => MaybePromise<HeadersInit>) | undefined;
    traceHeaders: TraceHeaders;
  }): UTReporter =>
  (type, payload) =>
    Micro.gen(function* () {
      const url = createAPIRequestUrl({
        url: cfg.url,
        slug: cfg.endpoint,
        actionType: type,
      });
      const headers = new Headers(
        yield* Micro.promise(async () =>
          typeof cfg.headers === "function" ? await cfg.headers() : cfg.headers,
        ),
      );
      if (cfg.package) {
        headers.set("x-uploadthing-package", cfg.package);
      }
      headers.set("x-uploadthing-version", pkgJson.version);
      headers.set("Content-Type", "application/json");
      headers.set("b3", cfg.traceHeaders.b3);
      headers.set("traceparent", cfg.traceHeaders.traceparent);

      const response = yield* fetchEff(url, {
        method: "POST",
        body: JSON.stringify(payload),
        headers,
      }).pipe(
        Micro.andThen(parseResponseJson),
        /**
         * We don't _need_ to validate the response here, just cast it for now.
         * As of now, @effect/schema includes quite a few bytes we cut out by this...
         * We have "strong typing" on the backend that ensures the shape should match.
         */
        Micro.map(unsafeCoerce<unknown, UTEvents[typeof type]["out"]>),
        Micro.catchTag("FetchError", (e) =>
          Micro.fail(
            new UploadThingError({
              code: "INTERNAL_CLIENT_ERROR",
              message: `Failed to report event "${type}" to UploadThing server`,
              cause: e,
            }),
          ),
        ),
        Micro.catchTag("BadRequestError", (e) =>
          Micro.fail(
            new UploadThingError({
              code: getErrorTypeFromStatusCode(e.status),
              message: e.getMessage(),
              cause: e.json,
            }),
          ),
        ),
        Micro.catchTag("InvalidJson", (e) =>
          Micro.fail(
            new UploadThingError({
              code: "INTERNAL_CLIENT_ERROR",
              message: "Failed to parse response from UploadThing server",
              cause: e,
            }),
          ),
        ),
      );

      return response;
    });
