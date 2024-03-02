import { Effect } from "effect";
import { TaggedError } from "effect/Data";
import { process } from "std-env";

import type { RouteHandlerConfig } from "./types";

/*
 * Returns a full URL to the dev's uploadthing endpoint
 * Can take either an origin, or a pathname, or a full URL
 * and will return the "closest" url matching the default
 * `<VERCEL_URL || localhost>/api/uploadthing`
 */
export class InvalidURLError extends TaggedError("InvalidURL")<{
  reason: string;
}> {
  constructor(attemptedUrl: string) {
    super({ reason: `Failed to parse '${attemptedUrl}' as a URL.` });
  }
}

const getFullApiUrl = (maybeUrl?: string) =>
  Effect.gen(function* ($) {
    const base = (() => {
      if (typeof window !== "undefined") return window.location.origin;
      if (process.env?.VERCEL_URL) return `https://${process.env.VERCEL_URL}`;
      return "http://localhost:3000";
    })();

    const url = yield* $(
      Effect.try({
        try: () => new URL(maybeUrl ?? "/api/uploadthing", base),
        catch: () => new InvalidURLError(maybeUrl ?? "/api/uploadthing"),
      }),
    );

    if (url.pathname === "/") {
      url.pathname = "/api/uploadthing";
    }
    return url;
  });

export const resolveMaybeUrlArg = (maybeUrl: string | URL | undefined) => {
  return maybeUrl instanceof URL
    ? maybeUrl
    : Effect.runSync(getFullApiUrl(maybeUrl));
};

export const resolveCallbackUrl = (opts: {
  config: RouteHandlerConfig | undefined;
  req: Request;
  isDev: boolean;
  logWarning: (typeof console)["warn"];
}) => {
  return Effect.gen(function* ($) {
    let callbackUrl = new URL(opts.req.url);
    if (opts.config?.callbackUrl) {
      callbackUrl = yield* $(getFullApiUrl(opts.config.callbackUrl));
    } else if (process.env.UPLOADTHING_URL) {
      callbackUrl = yield* $(getFullApiUrl(process.env.UPLOADTHING_URL));
    }

    if (opts.isDev || !callbackUrl.host.includes("localhost")) {
      return callbackUrl;
    }

    // Production builds have to have a public URL so UT can send webhook
    // Parse the URL from the headers
    const headers = opts.req.headers;
    let parsedFromHeaders =
      headers.get("origin") ??
      headers.get("referer") ??
      headers.get("host") ??
      headers.get("x-forwarded-host");

    if (parsedFromHeaders && !parsedFromHeaders.includes("http")) {
      parsedFromHeaders =
        (headers.get("x-forwarded-proto") ?? "https") +
        "://" +
        parsedFromHeaders;
    }

    if (!parsedFromHeaders || parsedFromHeaders.includes("localhost")) {
      // Didn't find a valid URL in the headers, log a warning and use the original url anyway
      opts.logWarning(
        "You are using a localhost callback url in production which is not supported.",
        "Read more and learn how to fix it here: https://docs.uploadthing.com/faq#my-callback-runs-in-development-but-not-in-production",
      );
      return callbackUrl;
    }

    return yield* $(getFullApiUrl(parsedFromHeaders));
  });
};
