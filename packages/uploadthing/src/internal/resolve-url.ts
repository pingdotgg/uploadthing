import * as Effect from "effect/Effect";
import { process } from "std-env";

import { getFullApiUrl } from "@uploadthing/shared";

import { requestContext } from "./validate-request-input";

export const resolveCallbackUrl = () => {
  return Effect.gen(function* () {
    const { config, req, isDev } = yield* requestContext;
    let callbackUrl = new URL(req.url);
    if (config?.callbackUrl) {
      callbackUrl = yield* getFullApiUrl(config.callbackUrl);
    } else if (process.env.UPLOADTHING_URL) {
      callbackUrl = yield* getFullApiUrl(process.env.UPLOADTHING_URL);
    }

    if (isDev || !callbackUrl.host.includes("localhost")) {
      return callbackUrl;
    }

    // Production builds have to have a public URL so UT can send webhook
    // Parse the URL from the headers
    let parsedFromHeaders =
      req.headers.get("origin") ??
      req.headers.get("referer") ??
      req.headers.get("host") ??
      req.headers.get("x-forwarded-host");

    if (parsedFromHeaders && !parsedFromHeaders.includes("http")) {
      parsedFromHeaders =
        (req.headers.get("x-forwarded-proto") ?? "https") +
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

    return yield* getFullApiUrl(parsedFromHeaders);
  });
};
