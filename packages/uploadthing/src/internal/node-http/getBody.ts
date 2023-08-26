import type { IncomingMessage } from "http";

export type BodyResult =
  | {
      ok: true;
      data: unknown;
    }
  | { ok: false; error: Error };
export type NodeHTTPRequest = IncomingMessage & {
  body?: unknown;
};
export async function getPostBody(opts: {
  req: NodeHTTPRequest;
  maxBodySize?: number;
}): Promise<BodyResult> {
  const { req, maxBodySize = Infinity } = opts;
  return new Promise((resolve) => {
    if ("body" in req) {
      const isJsonType = req.headers["content-type"] === "application/json";

      if (!isJsonType) {
        resolve({
          ok: false,
          error: new Error("INVALID_CONTENT_TYPE"),
        });
        return;
      }

      if (typeof req.body !== "object") {
        resolve({
          ok: false,
          error: new Error("INVALID_BODY"),
        });
        return;
      }

      resolve({
        ok: true,
        data: req.body,
      });
      return;
    }
    let body = "";
    let hasBody = false;
    req.on("data", function (data) {
      body += data;
      hasBody = true;
      if (body.length > maxBodySize) {
        resolve({
          ok: false,
          error: new Error("PAYLOAD_TOO_LARGE"),
        });
        req.socket.destroy();
      }
    });
    req.on("end", () => {
      let parsedBody: unknown;
      try {
        parsedBody = JSON.parse(body);
      } catch (e) {
        resolve({
          ok: false,
          error: new Error("INVALID_JSON"),
        });
        return;
      }

      resolve({
        ok: true,
        data: hasBody ? parsedBody : undefined,
      });
    });
  });
}
