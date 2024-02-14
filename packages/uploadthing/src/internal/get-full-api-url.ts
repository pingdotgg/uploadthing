import { process } from "std-env";

import { logger } from "./logger";
import type { FileRouter, RouterWithConfig } from "./types";

/*
 * Returns a full URL to the dev's uploadthing endpoint
 * Can take either an origin, or a pathname, or a full URL
 * and will return the "closest" url matching the default
 * `<VERCEL_URL || localhost>/api/uploadthing`
 */
export function getFullApiUrl(maybeUrl?: string): URL {
  const base = (() => {
    if (typeof window !== "undefined") return window.location.origin;
    if (process.env?.VERCEL_URL) return `https://${process.env.VERCEL_URL}`;
    return "http://localhost:3000";
  })();

  try {
    const url = new URL(maybeUrl ?? "/api/uploadthing", base);
    if (url.pathname === "/") {
      url.pathname = "/api/uploadthing";
    }
    return url;
  } catch (err) {
    throw new Error(
      `Failed to parse '${maybeUrl}' as a URL. Make sure it's a valid URL or path`,
    );
  }
}

export function resolveMaybeUrlArg(maybeUrl: string | URL | undefined) {
  return maybeUrl instanceof URL ? maybeUrl : getFullApiUrl(maybeUrl);
}

export function resolveCallbackUrl(opts: {
  config: RouterWithConfig<FileRouter>["config"];
  req: Request;

  isDev: boolean;
}): URL {
  let callbackUrl = new URL(opts.req.url);
  if (opts.config?.callbackUrl) {
    callbackUrl = getFullApiUrl(opts.config.callbackUrl);
  } else if (process.env.UPLOADTHING_URL) {
    callbackUrl = getFullApiUrl(process.env.UPLOADTHING_URL);
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
      (headers.get("x-forwarded-proto") ?? "https") + "://" + parsedFromHeaders;
  }

  if (!parsedFromHeaders || parsedFromHeaders.includes("localhost")) {
    // Didn't find a valid URL in the headers, log a warning and use the original url anyway
    logger.warn(
      "You are using a localhost callback url in production which is not supported.",
      "Read more and learn how to fix it here: https://docs.uploadthing.com/faq#my-callback-runs-in-development-but-not-in-production",
    );
    return callbackUrl;
  }

  return getFullApiUrl(parsedFromHeaders);
}
