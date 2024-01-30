import { Schema } from "@effect/schema";
import { Data, Duration, Effect, Schedule, pipe } from "effect";

import type { FetchEsque } from "@uploadthing/shared";

export class FetchError extends Data.TaggedError("FetchError")<{
  readonly input: RequestInfo | URL;
  readonly error: unknown;
}> { }

// Temporary Effect wrappers below.
// TODO should be refactored with much love

// TODO handle error properly

export const fetchEff = (
  fetchFn: FetchEsque,
  input: RequestInfo | URL,
  init?: RequestInit,
) =>
  Effect.tryPromise({
    try: () => fetchFn(input, init),
    catch: (error) => new FetchError({ error, input }),
  }).pipe(
    Effect.withSpan("fetch", { attributes: { input: JSON.stringify(input) } }),
  );

export const fetchEffJson = <Res>(
  fetchFn: FetchEsque,
  schema: Schema.Schema<never, any, Res>,
  input: RequestInfo | URL,
  init?: RequestInit,
) =>
  fetchEff(fetchFn, input, init).pipe(
    Effect.andThen((res) =>
      Effect.tryPromise({
        try: () => res.json(),
        catch: (error) => new FetchError({ error, input }),
      }),
    ),
    Effect.andThen(Schema.decode(schema)),
    Effect.withSpan("fetchJson", {
      attributes: { input: JSON.stringify(input) },
    }),
  );


export const exponentialBackoff10Sec: Schedule.Schedule<
  never,
  unknown,
  Duration.DurationInput
> = pipe(
  Schedule.exponential(Duration.millis(10), 4), // 10ms, 40ms, 160ms, 640ms, 2560ms, ...
  Schedule.andThenEither(Schedule.spaced(Duration.seconds(1))),
  Schedule.compose(Schedule.elapsed),
  Schedule.whileOutput(Duration.lessThanOrEqualTo(Duration.minutes(1))), // max 1 minute
);