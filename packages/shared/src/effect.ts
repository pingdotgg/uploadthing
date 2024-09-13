import * as Context from "effect/Context";
import * as Micro from "effect/Micro";

import { BadRequestError, FetchError, InvalidJsonError } from "./tagged-errors";
import type { FetchEsque, ResponseEsque } from "./types";

export class FetchContext
  extends /** #__PURE__ */ Context.Tag("uploadthing/Fetch")<
    FetchContext,
    FetchEsque
  >() {}

interface ResponseWithURL extends ResponseEsque {
  requestUrl: string;
}

// Temporary Effect wrappers below.
// Only for use in the browser.
// On the server, use `@effect/platform.HttpClient` instead.
export const fetchEff = (
  input: string | URL,
  init?: RequestInit,
): Micro.Micro<ResponseWithURL, FetchError, FetchContext> =>
  Micro.flatMap(Micro.service(FetchContext), (fetch) => {
    const headers = new Headers(init?.headers ?? []);

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
      Micro.tapError((e) => Micro.sync(() => console.error(e.input))),
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
