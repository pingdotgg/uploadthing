import { Data, Effect } from "effect";

export class FetchError extends Data.TaggedError("FetchError")<{
  readonly input: RequestInfo | URL;
  readonly error: unknown;
}> {}

// Temporary Effect wrappers below.
// TODO should be refactored with much love

// TODO handle error properly
export const fetchEff = (input: RequestInfo | URL, init?: RequestInit) =>
  Effect.tryPromise({
    try: () => fetch(input, init),
    catch: (error) => new FetchError({ error, input }),
  }).pipe(
    Effect.withSpan("fetch", { attributes: { input: JSON.stringify(input) } }),
  );
