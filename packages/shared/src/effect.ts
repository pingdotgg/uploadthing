import * as Context from "effect/Context";
import * as Effect from "effect/Effect";

import { BadRequestError, FetchError, InvalidJsonError } from "./tagged-errors";
import type { FetchEsque, ResponseEsque } from "./types";

export class FetchContext
  extends /** #__PURE__ */ Context.Service<FetchContext, FetchEsque>()(
    "uploadthing/Fetch",
  ) {}

interface ResponseWithURL extends ResponseEsque {
  requestUrl: string;
}

// Temporary Effect wrappers below.
// Only for use in the browser.
// On the server, use `effect/unstable/http.HttpClient` instead.
export const fetchEff = (
  input: string | URL,
  init?: RequestInit,
): Effect.Effect<ResponseWithURL, FetchError, FetchContext> =>
  Effect.flatMap(FetchContext, (fetch) => {
    const headers = new Headers(init?.headers ?? []);

    const reqInfo = {
      url: input.toString(),
      method: init?.method,
      body: init?.body,
      headers: Object.fromEntries(headers),
    };

    return Effect.tryPromise({
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
      // eslint-disable-next-line no-console
      Effect.tapError((e) => Effect.sync(() => console.error(e.input))),
      Effect.map((res) => Object.assign(res, { requestUrl: reqInfo.url })),
      Effect.withSpan("fetch"),
    );
  });

export const parseResponseJson = (
  res: ResponseWithURL,
): Effect.Effect<unknown, InvalidJsonError | BadRequestError> =>
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
