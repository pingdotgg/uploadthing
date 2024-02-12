import { process } from "std-env";

import { logger } from "../logger";

type IncomingMessageLike = {
  url?: string;
  method?: string;
  headers?: Record<string, string | string[] | undefined>;
  body?: any;
};

function parseURL(req: IncomingMessageLike): URL {
  const headers = req.headers;
  let relativeUrl = req.url ?? "/";
  if ("baseUrl" in req && typeof req.baseUrl === "string") {
    relativeUrl = req.baseUrl + relativeUrl;
  }

  const proto = headers?.["x-forwarded-proto"] ?? "http";
  const host = headers?.["x-forwarded-host"] ?? headers?.host;

  if (typeof proto !== "string" || typeof host !== "string") {
    try {
      const host = process.env.UPLOADTHING_URL;
      logger.debug(
        "No headers found in request. Using UPLOADTHING_URL environment variable as base URL:",
        host,
      );
      return new URL(relativeUrl, host);
    } catch (e) {
      logger.error(
        `Failed to parse URL from request. UPLOADTHING_URL is not a valid URL.`,
      );
      throw e;
    }
  }

  try {
    return new URL(`${proto}://${host}${relativeUrl}`);
  } catch (e) {
    logger.error(
      `Failed to parse URL from request. '${proto}://${host}${relativeUrl}' is not a valid URL.`,
    );
    throw e;
  }
}

export function toWebRequest(req: IncomingMessageLike, body?: any) {
  body ??= req.body;
  const bodyStr = typeof body === "string" ? body : JSON.stringify(body);
  const method = req.method ?? "GET";
  const allowsBody = ["POST", "PUT", "PATCH"].includes(method);
  return new Request(parseURL(req), {
    method,
    headers: req.headers as HeadersInit,
    ...(allowsBody ? { body: bodyStr } : {}),
  });
}
