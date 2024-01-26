import type { IncomingMessage } from "node:http";

import { UploadThingError } from "@uploadthing/shared";

import { logger } from "../logger";

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
      const contentType = req.headers["content-type"];

      if (contentType !== "application/json") {
        logger.error("Expected JSON content type, got:", contentType);
        resolve({
          ok: false,
          error: new UploadThingError({
            code: "BAD_REQUEST",
            message: "INVALID_CONTENT_TYPE",
          }),
        });
        return;
      }

      if (typeof req.body !== "object") {
        logger.error(
          "Expected body to be of type 'object', got:",
          typeof req.body,
        );
        resolve({
          ok: false,
          error: new UploadThingError({
            code: "BAD_REQUEST",
            message: "INVALID_BODY",
          }),
        });
        return;
      }

      logger.debug("Body parsed successfully.", req.body);
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
        logger.error(
          "Body too large, max size is",
          maxBodySize,
          "bytes but received",
          body.length,
          "bytes",
        );
        resolve({
          ok: false,
          error: new UploadThingError({
            code: "BAD_REQUEST",
            message: "PAYLOAD_TOO_LARGE",
          }),
        });
        req.socket.destroy();
      }
    });
    req.on("end", () => {
      let parsedBody: unknown;
      try {
        logger.debug("Finished reading body, parsing as JSON", body);
        parsedBody = JSON.parse(body);
      } catch (e) {
        logger.error("Error parsing JSON:", body);
        resolve({
          ok: false,
          error: new UploadThingError({
            code: "BAD_REQUEST",
            message: "INVALID_JSON",
            cause: e,
          }),
        });
        return;
      }

      logger.debug("Body parsed successfully.", parsedBody);
      resolve({
        ok: true,
        data: hasBody ? parsedBody : undefined,
      });
    });
  });
}
