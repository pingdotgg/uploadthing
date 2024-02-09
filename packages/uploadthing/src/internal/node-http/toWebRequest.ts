import { process } from "std-env";

import { logger } from "../logger";

type IncomingMessageLike = {
  method?: string;
  headers?: Record<string, string | string[] | undefined>;
  body?: any;
};

export function parseUrlFromHeaders(
  relativeUrl: string | undefined,
  headers: Record<string, string | string[] | undefined>,
): URL {
  const proto = (headers["x-forwarded-proto"] as string) ?? "http";
  const host = headers.host as string;
  const origin = headers.origin as string;
  try {
    // proto and host headers are standard in HTTP/1.1
    return new URL(relativeUrl ?? "/", `${proto}://${host}`);
  } catch {
    logger.warn(
      "No valid URL could be parsed using proto+host headers. Trying origin.",
    );
  }
  try {
    // e.g. FlightControl doesn't adhere to this and doesn't send a host header...
    return new URL(relativeUrl ?? "/", origin);
  } catch {
    logger.warn(
      "No valid URL could be parsed using origin header. Trying environment variable.",
    );
  }
  try {
    return new URL(relativeUrl ?? "/", process.env.UPLOADTHING_URL);
  } catch {
    logger.fatal(
      "No valid URL could be parsed using environment variable. Aborting.",
    );
    throw new Error(
      `No valid URL could be parsed. Tried proto+host, origin, and environment variable: ${JSON.stringify(
        {
          relativeUrl,
          proto,
          host,
          origin,
          env: process.env.UPLOADTHING_URL,
        },
      )}`,
    );
  }
}

export function toWebRequest(req: IncomingMessageLike, url: URL, body?: any) {
  body ??= req.body;
  const bodyStr = typeof body === "string" ? body : JSON.stringify(body);
  const method = req.method ?? "GET";
  const allowsBody = ["POST", "PUT", "PATCH"].includes(method);
  return new Request(url, {
    method,
    headers: req.headers as HeadersInit,
    ...(allowsBody ? { body: bodyStr } : {}),
  });
}
