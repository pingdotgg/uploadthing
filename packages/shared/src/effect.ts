import * as Context from "effect/Context";
import * as Duration from "effect/Duration";
import { pipe } from "effect/Function";
import * as Micro from "effect/Micro";
import * as Schedule from "effect/Schedule";

import { BadRequestError, FetchError, InvalidJsonError } from "./tagged-errors";
import type { FetchEsque, ResponseEsque } from "./types";

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
): Micro.Micro<ResponseWithURL, FetchError, FetchContext> =>
  Micro.flatMap(Micro.service(FetchContext), ({ fetch, baseHeaders }) => {
    const headers = new Headers(init?.headers ?? []);
    for (const [key, value] of Object.entries(baseHeaders)) {
      if (typeof value === "string") headers.set(key, value);
    }

    const reqInfo = {
      url: input.toString(),
      method: init?.method,
      body: init?.body,
      headers: Object.fromEntries(headers),
    };

    return Micro.tryPromise({
      try: (signal) => fetch(input, { ...init, headers, signal }),
      catch: (error) =>
        new FetchError({
          error:
            error instanceof Error
              ? {
                  ...error,
                  name: error.name,
                  message: error.message,
                  stack: error.stack,
                }
              : error,
          input: reqInfo,
        }),
    }).pipe(
      Micro.map((res) => Object.assign(res, { requestUrl: reqInfo.url })),
      Micro.withTrace("fetch"),
    );
  });

export const parseResponseJson = (
  res: ResponseWithURL,
): Micro.Micro<unknown, InvalidJsonError | BadRequestError> =>
  Micro.tryPromise({
    try: async () => {
      const json = await res.json();
      return { json, ok: res.ok, status: res.status };
    },
    catch: (error) => new InvalidJsonError({ error, input: res.requestUrl }),
  }).pipe(
    Micro.filterOrFail(
      ({ ok }) => ok,
      ({ json, status }) =>
        new BadRequestError({
          status,
          message: `Request to ${res.requestUrl} failed with status ${status}`,
          json,
        }),
    ),
    Micro.map(({ json }) => json),
    Micro.withTrace("parseJson"),
  );

export const parseRequestJson = (req: Request) =>
  Micro.tryPromise({
    try: () => req.json() as Promise<unknown>,
    catch: (error) => new InvalidJsonError({ error, input: req.url }),
  }).pipe(Micro.withTrace("parseRequestJson"));

/**
 * Schedule that retries with exponential backoff, up to 1 minute.
 * 10ms * 4^n, where n is the number of retries.
 */
export const exponentialBackoff = () =>
  pipe(
    Schedule.exponential(Duration.millis(10), 4), // 10ms, 40ms, 160ms, 640ms...
    Schedule.andThenEither(Schedule.spaced(Duration.seconds(1))),
    Schedule.compose(Schedule.elapsed),
    Schedule.whileOutput(Duration.lessThanOrEqualTo(Duration.minutes(1))),
  );

/**
 * Schedule that retries with exponential backoff, up to 1 minute.
 * 10ms * 4^n, where n is the number of retries.
 */
export const exponentialDelay = pipe(
  Micro.delayExponential(10, 4),
  Micro.delayWithMax(1000),
  Micro.delayWithMaxElapsed(16_000),
);
