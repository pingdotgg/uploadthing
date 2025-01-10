import * as Redacted from "effect/Redacted";
import * as S from "effect/Schema";
import type { StrictRequest } from "msw";
import { http, HttpResponse } from "msw";
import { vi } from "vitest";

import { UPLOADTHING_VERSION } from "../src/_internal/config";
import { ParsedToken, UploadThingToken } from "../src/_internal/shared-schemas";
import type { ActionType } from "../src/_internal/shared-schemas";
import type { UploadPutResult } from "../src/_internal/types";

export const requestSpy = vi.fn<(url: string, req: RequestInit) => void>();
export const requestsToDomain = (domain: string) =>
  requestSpy.mock.calls.filter(([url]) => url.includes(domain));

export const middlewareMock = vi.fn();
export const uploadCompleteMock = vi.fn();
export const onErrorMock = vi.fn();

const tokenData = {
  apiKey: Redacted.make("sk_foo"),
  appId: "app-1",
  regions: ["fra1"] as const,
};
export const testToken = {
  encoded: S.encodeSync(UploadThingToken)(ParsedToken.make(tokenData)),
  decoded: tokenData,
};

export const API_URL =
  typeof process !== "undefined" && process.env.UPLOADTHING_API_URL
    ? process.env.UPLOADTHING_API_URL
    : "https://api.uploadthing.com";
export const UFS_HOST =
  typeof process !== "undefined" && process.env.UPLOADTHING_API_URL
    ? "utf-staging.com"
    : "ufs.sh";
export const INGEST_URL =
  typeof process !== "undefined" && process.env.UPLOADTHING_API_URL
    ? "https://fra1.ingest.ut-staging.com"
    : "https://fra1.ingest.uploadthing.com";

export const fileUrlPattern = (appId = testToken.decoded.appId) =>
  new RegExp(`^https://${appId}.${UFS_HOST}/f/.+$`);

export const createApiUrl = (slug: string, action?: typeof ActionType.Type) => {
  const url = new URL("http://localhost:3000");
  url.searchParams.set("slug", slug);
  if (action) url.searchParams.set("actionType", action);
  return url;
};

export const doNotExecute = (_fn: (...args: any[]) => any) => {
  // noop
};

export const baseHeaders = {
  "x-uploadthing-version": UPLOADTHING_VERSION,
  "x-uploadthing-package": "vitest",
};

/**
 * Call this in each MSW handler to spy on the request
 * and provide an easy way to assert on the request
 */
export const callRequestSpy = async (request: StrictRequest<any>) =>
  requestSpy(new URL(request.url).toString(), {
    method: request.method,
    headers: Object.fromEntries(request.headers),
    body: await (() => {
      if (request.method === "GET") return null;
      const ct = request.headers.get("content-type");
      const cloned = request.clone();
      if (ct?.includes("application/json")) return cloned.json();
      if (ct?.includes("multipart/form-data")) return cloned.formData();
      return cloned.blob();
    })(),
  });

export const handlers = [
  /**
   * Static Assets
   */
  http.get("https://cdn.foo.com/:fileKey", async ({ request }) => {
    await callRequestSpy(request);
    return HttpResponse.text("Lorem ipsum doler sit amet");
  }),
  http.get(`https://(.+).${UFS_HOST}/f/:key`, async ({ request }) => {
    await callRequestSpy(request);
    return HttpResponse.text("Lorem ipsum doler sit amet");
  }),
  /**
   * UploadThing Ingest
   */
  http.all<{ key: string }>(
    `${INGEST_URL}/:key`,
    async ({ request, params }) => {
      await callRequestSpy(request);
      const appId = new URLSearchParams(request.url).get("x-ut-identifier");
      return HttpResponse.json<UploadPutResult>({
        url: `https://${appId}.${UFS_HOST}/f/${params.key}`,
        appUrl: `https://${appId}.${UFS_HOST}/f/${params.key}`,
        serverData: null,
        fileHash: Array.from(new Uint8Array(await request.arrayBuffer()))
          .map((b) => b.toString(16).padStart(2, "0"))
          .join(""),
      });
    },
  ),
  /**
   * UploadThing API
   */
  http.post(`${API_URL}/v6/requestFileAccess`, async ({ request }) => {
    await callRequestSpy(request);
    return HttpResponse.json({
      url: `https://{APP_ID}.${UFS_HOST}/f/someFileKey?x-some-amz=query-param`,
    });
  }),
  http.post(`${API_URL}/v6/updateACL`, async ({ request }) => {
    await callRequestSpy(request);
    return HttpResponse.json({ success: true });
  }),
];
