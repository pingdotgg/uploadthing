import { logger } from "../logger";

type IncomingMessageLike = {
  url?: string;
  method?: string;
  headers?: Record<string, string | string[] | undefined>;
  body?: any;
};

function parseURL(req: IncomingMessageLike): URL {
  const { url: relativeUrl = "/", headers } = req;

  const proto = (headers?.["x-forwarded-proto"] as string) ?? "http";
  const host = (headers?.["x-forwarded-host"] ?? headers?.host) as string;

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
