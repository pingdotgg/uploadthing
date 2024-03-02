import type { FetchEsque } from "@uploadthing/shared";
import { UploadThingError } from "@uploadthing/shared";

import { UPLOADTHING_VERSION } from "./constants";
import { maybeParseResponseXML } from "./s3-error-parser";
import type { ActionType, UTEvents } from "./types";

export const createAPIRequestUrl = (config: {
  /**
   * URL to the UploadThing API endpoint
   * @example URL { /api/uploadthing }
   * @example URL { https://www.example.com/api/uploadthing }
   */
  url: URL;
  slug: string;
  actionType: ActionType;
}) => {
  const url = new URL(config.url);

  const queryParams = new URLSearchParams(url.search);
  queryParams.set("actionType", config.actionType);
  queryParams.set("slug", config.slug);

  url.search = queryParams.toString();
  return url;
};

export type UTReporter = <TEvent extends keyof UTEvents>(
  type: TEvent,
  payload: UTEvents[TEvent],
) => Promise<boolean>;

/**
 * Creates a "client" for reporting events to the UploadThing server via the user's API endpoint.
 * Events are handled in "./handler.ts starting at L200"
 */
export const createUTReporter = (cfg: {
  url: URL;
  endpoint: string;
  package: string;
  fetch: FetchEsque;
}): UTReporter => {
  return async (type, payload) => {
    const url = createAPIRequestUrl({
      url: cfg.url,
      slug: cfg.endpoint,
      actionType: type,
    });
    const response = await cfg.fetch(url, {
      method: "POST",
      body: JSON.stringify(payload),
      headers: {
        "Content-Type": "application/json",
        "x-uploadthing-package": cfg.package,
        "x-uploadthing-version": UPLOADTHING_VERSION,
      },
    });

    switch (type) {
      case "failure": {
        // why isn't this narrowed automatically?
        const p = payload as UTEvents["failure"];
        const parsed = maybeParseResponseXML(p.s3Error ?? "");
        if (parsed?.message) {
          throw new UploadThingError({
            code: parsed.code,
            message: parsed.message,
          });
        } else {
          throw new UploadThingError({
            code: "UPLOAD_FAILED",
            message: `Failed to upload file ${p.fileName} to S3`,
            cause: p.s3Error,
          });
        }
      }
    }

    return response.ok;
  };
};
