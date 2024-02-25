import { beforeEach, vi } from "vitest";

import type { FetchEsque } from "@uploadthing/shared";

import { UPLOADTHING_VERSION } from "../src/constants";
import type { ActionType } from "../src/server";

export const fetchMock = vi.fn();
beforeEach(() => {
  fetchMock.mockClear();
});

export const createApiUrl = (slug: string, action?: ActionType) => {
  const url = new URL("https://not-used.com");
  url.searchParams.set("slug", slug);
  if (action) url.searchParams.set("actionType", action);
  return url;
};

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
