import type { ParseError } from "@effect/schema/ParseResult";
import * as S from "@effect/schema/Schema";
import * as Context from "effect/Context";
import * as Duration from "effect/Duration";
import * as Effect from "effect/Effect";
import { pipe } from "effect/Function";
import * as Schedule from "effect/Schedule";

import { FetchError } from "./tagged-errors";
import type { FetchEsque, Json, ResponseEsque } from "./types";
import { filterObjectValues, getRequestUrl } from "./utils";

export type FetchContextService = {
  fetch: FetchEsque;
  baseHeaders: Record<string, string | undefined> & {
    "x-uploadthing-version": string;
    "x-uploadthing-api-key": string | undefined;
    "x-uploadthing-fe-package": string | undefined;
    "x-uploadthing-be-adapter": string | undefined;
  };
};
export class FetchContext extends Context.Tag("uploadthing/FetchContext")<
  FetchContext,
  FetchContextService
>() {}

// Temporary Effect wrappers below.
// TODO should be refactored with much love
// TODO handle error properly
export const fetchEff = (
  input: RequestInfo | URL,
  init?: RequestInit,
): Effect.Effect<ResponseEsque, FetchError, FetchContext> =>
  FetchContext.pipe(
    Effect.andThen(({ fetch, baseHeaders }) =>
      Effect.tryPromise({
        try: () =>
          fetch(input, {
            ...init,
            headers: {
              ...filterObjectValues(baseHeaders, (v): v is string => v != null),
              ...init?.headers,
            },
          }),
        catch: (error) => new FetchError({ error, input }),
      }),
    ),
    Effect.withSpan("fetch", {
      attributes: { input: JSON.stringify(input) },
    }),
  );

export const fetchEffJson = <Schema>(
  input: RequestInfo | URL,
  /** Schema to be used if the response returned a 2xx  */
  schema: S.Schema<Schema, any>,
  init?: RequestInit,
): Effect.Effect<Schema, FetchError | ParseError, FetchContext> => {
  return fetchEff(input, init).pipe(
    Effect.andThen((res) =>
      Effect.tryPromise({
        try: async () => {
          const json = await res.json();
          return { ok: res.ok, json, status: res.status };
        },
        catch: (error) => new FetchError({ error, input }),
      }),
    ),
    Effect.andThen(({ ok, json, status }) =>
      ok
        ? Effect.succeed(json)
        : Effect.fail(
            new FetchError({
              error: `Request to ${getRequestUrl(input)} failed with status ${status}`,
              data: json as Json,
              input,
            }),
          ),
    ),
    Effect.andThen(S.decode(schema)),
    Effect.withSpan("fetchJson", {
      attributes: { input: JSON.stringify(input) },
    }),
  );
};

export const parseRequestJson = <Schema>(
  reqOrRes: Request | ResponseEsque,
  schema: S.Schema<Schema, any>,
): Effect.Effect<Schema, FetchError | ParseError> =>
  Effect.tryPromise({
    try: () => reqOrRes.json(),
    catch: (error) =>
      new FetchError({
        error,
        input:
          "url" in reqOrRes
            ? reqOrRes.url
            : `Response ${reqOrRes.status} - ${reqOrRes.statusText}`,
      }),
  }).pipe(Effect.andThen(S.decode(schema)));

/**
 * Schedule that retries with exponential backoff, up to 1 minute.
 * 10ms * 4^n, where n is the number of retries.
 */
export const exponentialBackoff = pipe(
  Schedule.exponential(Duration.millis(10), 4), // 10ms, 40ms, 160ms, 640ms...
  Schedule.andThenEither(Schedule.spaced(Duration.seconds(1))),
  Schedule.compose(Schedule.elapsed),
  Schedule.whileOutput(Duration.lessThanOrEqualTo(Duration.minutes(1))),
);
