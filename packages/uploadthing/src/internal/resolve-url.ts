import { Effect } from "effect";
import { process } from "std-env";

import { getFullApiUrl } from "@uploadthing/shared";

import type { RouteHandlerConfig } from "./types";

export const resolveCallbackUrl = (opts: {
  config: RouteHandlerConfig | undefined;
  req: Request;
  isDev: boolean;
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
      Effect.logWarning(
        "You are using a localhost callback url in production which is not supported.",
        "Read more and learn how to fix it here: https://docs.uploadthing.com/faq#my-callback-runs-in-development-but-not-in-production",
      );
      return callbackUrl;
    }

    return yield* $(getFullApiUrl(parsedFromHeaders));
  });
};
