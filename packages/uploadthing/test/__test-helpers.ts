import { beforeEach, vi } from "vitest";

import type { FetchEsque } from "@uploadthing/shared";

import { UPLOADTHING_VERSION } from "../src/constants";
import type { ActionType } from "../src/server";

export const fetchMock = vi.fn();
export const middlewareMock = vi.fn();
export const uploadCompleteMock = vi.fn();
beforeEach(() => {
  middlewareMock.mockClear();
  uploadCompleteMock.mockClear();
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

export const mockExternalRequests: FetchEsque = async (url, init) => {
  fetchMock(url, init);
  if (url instanceof Request) return new Response("Wut?", { status: 500 });
  url = new URL(url);

  // If request is going to uploadthing, mock the response
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

  // Else 404 (shouldn't happen, mock the requests we expect to make)
  return new Response("Not Found", { status: 404 });
};
