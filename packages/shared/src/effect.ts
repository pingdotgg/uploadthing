import type { ParseError } from "@effect/schema/ParseResult";
import * as S from "@effect/schema/Schema";
import { Context, Duration, Effect, pipe, Schedule } from "effect";

import { FetchError } from "./tagged-errors";
import type { FetchEsque, ResponseEsque } from "./types";
import { filterObjectValues } from "./utils";

export type FetchContextTag = {
  fetch: FetchEsque;
  baseHeaders: Record<string, string | undefined> & {
    "x-uploadthing-version": string;
    "x-uploadthing-api-key": string | undefined;
    "x-uploadthing-fe-package": string | undefined;
    "x-uploadthing-be-adapter": string | undefined;
  };
};
export const fetchContext =
  Context.GenericTag<FetchContextTag>("fetch-context");

// Temporary Effect wrappers below.
// TODO should be refactored with much love
// TODO handle error properly
export const fetchEff = (
  input: RequestInfo | URL,
  init?: RequestInit,
): Effect.Effect<ResponseEsque, FetchError, FetchContextTag> =>
  fetchContext.pipe(
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
  schema: S.Schema<Schema, any>,
  init?: RequestInit,
): Effect.Effect<Schema, FetchError | ParseError, FetchContextTag> =>
  fetchEff(input, init).pipe(
    Effect.andThen((res) =>
      Effect.tryPromise({
        try: () => res.json(),
        catch: (error) => new FetchError({ error, input }),
      }),
    ),
    Effect.andThen(S.decode(schema)),
    Effect.withSpan("fetchJson", {
      attributes: { input: JSON.stringify(input) },
    }),
  );

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
