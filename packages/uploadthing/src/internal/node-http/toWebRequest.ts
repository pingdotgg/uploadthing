import { Effect } from "effect";
import { TaggedError } from "effect/Data";
import { process } from "std-env";

import { logger } from "../logger";

type IncomingMessageLike = {
  method?: string | undefined;
  url?: string | undefined;
  headers?: Record<string, string | string[] | undefined>;
  body?: any;
};

class InvalidURL extends TaggedError("InvalidURL")<{
  reason: string;
}> {
  constructor(attemptedUrl: string, base?: string) {
    logger.error(
      `Failed to parse URL from request. '${attemptedUrl}' is not a valid URL with base '${base}'.`,
    );
    super({
      reason: `Failed to parse URL from request. '${attemptedUrl}' is not a valid URL with base '${base}'.`,
    });
  }
}

function parseURL(req: IncomingMessageLike) {
  const headers = req.headers;
  let relativeUrl = req.url ?? "/";
  if ("baseUrl" in req && typeof req.baseUrl === "string") {
    relativeUrl = req.baseUrl + relativeUrl;
  }

  const proto = headers?.["x-forwarded-proto"] ?? "http";
  const host = headers?.["x-forwarded-host"] ?? headers?.host;

  if (typeof proto !== "string" || typeof host !== "string") {
    return Effect.try({
      try: () => new URL(relativeUrl, process.env.UPLOADTHING_URL),
      catch: () => new InvalidURL(relativeUrl, process.env.UPLOADTHING_URL),
    });
  }

  return Effect.try({
    try: () => new URL(`${proto}://${host}${relativeUrl}`),
    catch: () => new InvalidURL(`${proto}://${host}${relativeUrl}`),
  });
}

export function toWebRequest(req: IncomingMessageLike, body?: any) {
  body ??= req.body;
  const bodyStr = typeof body === "string" ? body : JSON.stringify(body);
  const method = req.method ?? "GET";
  const allowsBody = ["POST", "PUT", "PATCH"].includes(method);

  return parseURL(req).pipe(
    Effect.catchTag("InvalidURL", (e) => Effect.die(e)),
    Effect.andThen(
      (url) =>
        new Request(url, {
          method,
          headers: req.headers as HeadersInit,
          ...(allowsBody ? { body: bodyStr } : {}),
        }),
    ),
  );
}
