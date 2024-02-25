import { vi } from "vitest";

import type { FetchEsque } from "@uploadthing/shared";

import { UPLOADTHING_VERSION } from "../src/constants";
import { createAPIRequestUrl } from "../src/internal/ut-reporter";
import type { ActionType } from "../src/server";

export const noop = vi.fn();
export const fetchMock = vi.fn();

export const createApiUrl = (slug: string, action: ActionType) =>
  createAPIRequestUrl({
    url: new URL("https://not-used.com"),
    slug,
    actionType: action,
  });
export const baseHeaders = {
  "x-uploadthing-version": UPLOADTHING_VERSION,
  "x-uploadthing-package": "vitest",
};

export const mockExternalRequests: FetchEsque = async (_url, init) => {
  fetchMock(_url, init);
  if (typeof _url !== "string") throw new Error("eh?");

  // If request is going to uploadthing, mock the response
  const url = new URL(_url);
  if (url.host === "uploadthing.com") {
    switch (url.pathname) {
      case "/api/prepareUpload": {
        return Response.json([]);
      }
      case "/api/completeMultipart": {
        return Response.json({ success: true });
      }
      case "/api/failureCallback": {
        return Response.json({ success: true });
      }
    }
  }

  // Else forward the requests ???
  // eslint-disable-next-line no-restricted-globals
  return fetch(url, init);
};
