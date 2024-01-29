import { Data, Effect } from "effect";

import { FetchEsque } from "@uploadthing/shared";

export class FetchError extends Data.TaggedError("FetchError")<{
  readonly input: RequestInfo | URL;
  readonly error: unknown;
}> {}

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
