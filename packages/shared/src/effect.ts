import type { ParseError } from "@effect/schema/ParseResult";
import * as S from "@effect/schema/Schema";
import * as Context from "effect/Context";
import * as Duration from "effect/Duration";
import * as Effect from "effect/Effect";
import { pipe } from "effect/Function";
import * as Schedule from "effect/Schedule";

import { BadRequestError, FetchError, InvalidJsonError } from "./tagged-errors";
import type { FetchEsque, ResponseEsque } from "./types";
import { filterObjectValues } from "./utils";

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

interface ResponseWithURL extends ResponseEsque {
  requestUrl: string;
}

// Temporary Effect wrappers below.
// TODO should be refactored with much love
// TODO handle error properly
export const fetchEff = (
  input: string | URL,
  init?: RequestInit,
): Effect.Effect<ResponseWithURL, FetchError, FetchContext> =>
  Effect.flatMap(FetchContext, ({ fetch, baseHeaders }) => {
    const reqInfo = {
      url: input.toString(),
      method: init?.method,
      body: init?.body,
      headers: {
        ...filterObjectValues(baseHeaders, (v): v is string => v != null),
        ...init?.headers,
      },
    };
    return Effect.tryPromise({
      try: () => fetch(input, { ...init, headers: reqInfo.headers }),
      catch: (error) => new FetchError({ error, input: reqInfo }),
    }).pipe(
      Effect.map((res) => Object.assign(res, { requestUrl: reqInfo.url })),
      Effect.withSpan("fetch", { attributes: { reqInfo } }),
    );
  });

export const parseJson = (
  res: ResponseWithURL,
): Effect.Effect<unknown, InvalidJsonError | BadRequestError, never> =>
  Effect.tryPromise({
    try: async () => {
      const json = await res.json();
      return { json, ok: res.ok, status: res.status };
    },
    catch: (error) => new InvalidJsonError({ error, input: res.requestUrl }),
  }).pipe(
    Effect.filterOrFail(
      ({ ok }) => ok,
      ({ json, status }) =>
        new BadRequestError({
          status,
          message: `Request to ${res.requestUrl} failed with status ${status}`,
          json,
        }),
    ),
    Effect.map(({ json }) => json),
    Effect.withSpan("parseJson"),
  );

// TODO: Remove in favor of composing parseJson and fetchEff at the caller
export const fetchEffJson = <Schema>(
  input: string | URL,
  /** Schema to be used if the response returned a 2xx  */
  schema: S.Schema<Schema, any>,
  init?: RequestInit,
): Effect.Effect<
  Schema,
  BadRequestError | FetchError | ParseError | InvalidJsonError,
  FetchContext
> => {
  return fetchEff(input, init).pipe(
    Effect.flatMap(parseJson),
    Effect.andThen(S.decode(schema)),
    Effect.withSpan("fetchJson", {
      attributes: { input: JSON.stringify(input) },
    }),
  );
};

export const parseRequestJson = <Schema>(
  reqOrRes: Request | ResponseEsque,
  schema: S.Schema<Schema, any>,
) =>
  Effect.tryPromise({
    try: () => reqOrRes.json(),
    catch: (error) =>
      new InvalidJsonError({
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
