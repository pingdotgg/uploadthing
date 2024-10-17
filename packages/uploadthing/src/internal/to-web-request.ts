import * as Config from "effect/Config";
import * as Data from "effect/Data";
import * as Effect from "effect/Effect";

import { UploadThingError } from "@uploadthing/shared";

type IncomingMessageLike = {
  method?: string | undefined;
  url?: string | undefined;
  headers?: Record<string, string | string[] | undefined>;
  body?: any;
};

class InvalidURL extends Data.Error<{
  reason: string;
}> {
  readonly _tag = "InvalidURL";
  readonly name = "InvalidURLError";
  constructor(attemptedUrl: string, base?: string) {
    Effect.runSync(
      Effect.logError(
        `Failed to parse URL from request. '${attemptedUrl}' is not a valid URL with base '${base}'.`,
      ),
    );
    super({
      reason: `Failed to parse URL from request. '${attemptedUrl}' is not a valid URL with base '${base}'.`,
    });
  }
}

const parseURL = (req: IncomingMessageLike): Effect.Effect<URL, InvalidURL> => {
  const headers = req.headers;
  let relativeUrl = req.url ?? "/";
  if ("baseUrl" in req && typeof req.baseUrl === "string") {
    relativeUrl = req.baseUrl + relativeUrl;
  }

  const proto = headers?.["x-forwarded-proto"] ?? "http";
  const host = headers?.["x-forwarded-host"] ?? headers?.host;

  const baseUrl = Config.string("url").pipe(
    Config.withDefault(`${proto.toString()}://${host?.toString()}`),
  );

  return Effect.flatMap(baseUrl, (baseUrl) =>
    Effect.try({
      try: () => new URL(relativeUrl, baseUrl),
      catch: () => new InvalidURL(relativeUrl, baseUrl),
    }),
  ).pipe(
    Effect.catchTag("ConfigError", () =>
      Effect.fail(new InvalidURL(relativeUrl)),
    ),
  );
};

const isBodyAllowed = (method: string) =>
  ["POST", "PUT", "PATCH"].includes(method);

export const getPostBody = <TBody = unknown>(opts: {
  req: IncomingMessageLike & {
    on: (event: string, listener: (data: any) => void) => void;
  };
}) =>
  Effect.async<TBody | undefined, UploadThingError>((resume) => {
    const { req } = opts;
    if (!req.method || !isBodyAllowed(req.method)) {
      return resume(Effect.succeed(undefined));
    }
    const contentType = req.headers?.["content-type"];

    if ("body" in req) {
      if (contentType !== "application/json") {
        Effect.runSync(
          Effect.logError("Expected JSON content type, got:", contentType),
        );
        return resume(
          new UploadThingError({
            code: "BAD_REQUEST",
            message: "INVALID_CONTENT_TYPE",
          }),
        );
      }

      if (typeof req.body !== "object") {
        Effect.runSync(
          Effect.logError(
            "Expected body to be of type 'object', got:",
            typeof req.body,
          ),
        );
        return resume(
          new UploadThingError({
            code: "BAD_REQUEST",
            message: "INVALID_BODY",
          }),
        );
      }

      Effect.runSync(Effect.logDebug("Body parsed successfully.", req.body));
      return resume(Effect.succeed(req.body as TBody));
    }

    let body = "";
    req.on("data", (data) => (body += data));
    req.on("end", () => {
      const parsedBody = Effect.try({
        try: () => JSON.parse(body) as TBody,
        catch: (err) =>
          new UploadThingError({
            code: "BAD_REQUEST",
            message: "INVALID_JSON",
            cause: err,
          }),
      });
      return resume(parsedBody);
    });
  });

export const toWebRequest = (
  req: IncomingMessageLike,
  body?: any,
): Effect.Effect<Request, never> => {
  body ??= req.body;
  const bodyStr = typeof body === "string" ? body : JSON.stringify(body);
  const method = req.method ?? "GET";
  const allowsBody = isBodyAllowed(method);

  const headers = new Headers();
  for (const [key, value] of Object.entries(req.headers ?? [])) {
    if (typeof value === "string") headers.set(key, value);
    if (Array.isArray(value)) headers.set(key, value.join(","));
  }

  return parseURL(req).pipe(
    Effect.catchTag("InvalidURL", (e) => Effect.die(e)),
    Effect.andThen(
      (url) =>
        new Request(url, {
          method,
          headers,
          ...(allowsBody ? { body: bodyStr } : {}),
        }),
    ),
  );
};
