import * as S from "@effect/schema/Schema";
import { Context, Data, Duration, Effect, pipe, Schedule } from "effect";

import type { FetchEsque } from "./types";

export class FetchError extends Data.TaggedError("FetchError")<{
  readonly input: RequestInfo | URL;
  readonly error: unknown;
}> {}

export const fetchContext = Context.Tag<{
  fetch: FetchEsque;
  baseHeaders?: Record<string, string>;
}>("fetch-context");

// Temporary Effect wrappers below.
// TODO should be refactored with much love
// TODO handle error properly

export const fetchEff = (input: RequestInfo | URL, init?: RequestInit) =>
  pipe(
    fetchContext,
    Effect.andThen(({ fetch, baseHeaders }) =>
      pipe(
        Effect.tryPromise({
          try: () =>
            fetch(input, {
              ...init,
              headers: {
                ...baseHeaders,
                ...init?.headers,
              },
            }),
          catch: (error) => new FetchError({ error, input }),
        }),
        Effect.withSpan("fetch", {
          attributes: { input: JSON.stringify(input) },
        }),
      ),
    ),
  );

export const fetchEffJson = <Res>(
  input: RequestInfo | URL,
  schema: S.Schema<never, any, Res>,
  init?: RequestInit,
) =>
  pipe(
    fetchEff(input, init),
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

/**
 * Schedule that retries with exponential backoff, up to 1 minute.
 * 10ms * 4^n, where n is the number of retries.
 */
export const exponentialBackoff: Schedule.Schedule<
  never,
  unknown,
  Duration.DurationInput
> = pipe(
  Schedule.exponential(Duration.millis(10), 4), // 10ms, 40ms, 160ms, 640ms...
  Schedule.andThenEither(Schedule.spaced(Duration.seconds(1))),
  Schedule.compose(Schedule.elapsed),
  Schedule.whileOutput(Duration.lessThanOrEqualTo(Duration.minutes(1))),
);
