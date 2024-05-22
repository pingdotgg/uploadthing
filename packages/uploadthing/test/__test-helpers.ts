import { createHash } from "node:crypto";
import type { StrictRequest } from "msw";
import { delay, http, HttpResponse } from "msw";
import { setupServer } from "msw/node";
import type { Test } from "vitest";
import { afterAll, beforeAll, it as itBase, vi } from "vitest";

import { lookup } from "@uploadthing/mime-types";
import { generateUploadThingURL } from "@uploadthing/shared";

import { UPLOADTHING_VERSION } from "../src/internal/constants";
import type {
  MPUResponse,
  PresignedBase,
  PSPResponse,
} from "../src/internal/shared-schemas";
import type { ActionType } from "../src/internal/types";

export const requestSpy = vi.fn<[string, RequestInit]>();
export const requestsToDomain = (domain: string) =>
  requestSpy.mock.calls.filter(([url]) => url.includes(domain));

export const middlewareMock = vi.fn();
export const uploadCompleteMock = vi.fn();
export const onErrorMock = vi.fn();

export const createApiUrl = (slug: string, action?: ActionType) => {
  const url = new URL("http://localhost:3000");
  url.searchParams.set("slug", slug);
  if (action) url.searchParams.set("actionType", action);
  return url;
};

export const baseHeaders = {
  "x-uploadthing-version": UPLOADTHING_VERSION,
  "x-uploadthing-package": "vitest",
};

export const genPort = (test: Test) => {
  const str = `${test.id}-${test.name}-${Date.now()}`;
  const hashedValue = createHash("sha256").update(str).digest("hex");
  const hashedInteger = parseInt(hashedValue, 16);
  const port = 1024 + (hashedInteger % (65535 - 1024 + 1));
  return port;
};

const mockPresigned = (file: {
  name: string;
  size: number;
  customId: string | null;
}): PSPResponse | MPUResponse => {
  const key = "abc-123.txt";
  const base: PresignedBase = {
    contentDisposition: "inline",
    customId: file.customId ?? null,
    fileName: file.name,
    fileType: lookup(file.name) as any,
    fileUrl: `https://utfs.io/f/${key}`,
    key,
    /**
     * This isn't the actual format of the polling JWT, but we use it in
     * tests just to easily be able to pull out the key from it.
     */
    pollingJwt: `random-jwt:${key}`,
    pollingUrl: generateUploadThingURL("/v7/pollUpload"),
  };
  if (file.size > 5 * 1024 * 1024) {
    return {
      ...base,
      chunkCount: 2,
      chunkSize: file.size / 2,
      uploadId: "random-upload-id",
      urls: [
        "https://bucket.s3.amazonaws.com/abc-123.txt?partNumber=1&uploadId=random-upload-id",
        "https://bucket.s3.amazonaws.com/abc-123.txt?partNumber=2&uploadId=random-upload-id",
      ],
    };
  }
  return {
    ...base,
    url: "https://bucket.s3.amazonaws.com",
    fields: { key },
  };
};

/**
 * Call this in each MSW handler to spy on the request
 * and provide an easy way to assert on the request
 */
const callRequestSpy = async (request: StrictRequest<any>) =>
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

const msw = setupServer();
beforeAll(() => msw.listen({ onUnhandledRequest: "bypass" }));
afterAll(() => msw.close());

export const resetMocks = () => msw.close();

/**
 * Extend the base `it` function to provide a `db` instance to our tests
 * and extend the MSW handlers to mock the UploadThing API
 *
 * NOTE:: Tests **must** destruct the `db` instance from the test context for it to be used
 * @example it("should do something", ({ db }) => { ... })
 */
export const it = itBase.extend({
  // eslint-disable-next-line no-empty-pattern
  db: async ({}, use) => {
    const files: any[] = [];
    const db = {
      files,
      insertFile: (file: any) => files.push(file),
      getFileByKey: (key: string) => files.find((f) => f.key === key),
    };
    msw.use(
      /**
       * S3
       */
      http.post("https://bucket.s3.amazonaws.com", async ({ request }) => {
        await callRequestSpy(request);
        return new HttpResponse();
      }),
      http.put("https://bucket.s3.amazonaws.com/:key", async ({ request }) => {
        await callRequestSpy(request);
        return new HttpResponse(null, {
          status: 204,
          headers: { ETag: "abc123" },
        });
      }),
      /**
       * Static Assets
       */
      http.get("https://cdn.foo.com/:fileKey", async ({ request }) => {
        await callRequestSpy(request);
        return HttpResponse.text("Lorem ipsum doler sit amet");
      }),
      http.get("https://utfs.io/f/:key", async ({ request }) => {
        await callRequestSpy(request);
        return HttpResponse.text("Lorem ipsum doler sit amet");
      }),
      /**
       * UploadThing API
       */
      http.post<never, { files: any[] } & Record<string, string>>(
        "https://api.uploadthing.com/v7/prepareUpload",
        async ({ request }) => {
          await callRequestSpy(request);
          const body = await request.json();

          const presigneds = body.files.map((file) => {
            const presigned = mockPresigned(file);
            db.insertFile({
              ...file,
              customId: file.customId ?? null,
              type: presigned.fileType,
              key: presigned.key,
              callbackUrl: body.callbackUrl,
              callbackSlug: body.callbackSlug,
              metadata: JSON.stringify(body.metadata ?? "{}"),
            });
            return presigned;
          });
          return HttpResponse.json({ data: presigneds });
        },
      ),
      http.post(
        "https://api.uploadthing.com/v6/completeMultipart",
        async ({ request }) => {
          await callRequestSpy(request);
          return HttpResponse.json({ success: true });
        },
      ),
      http.post(
        "https://api.uploadthing.com/v6/failureCallback",
        async ({ request }) => {
          await callRequestSpy(request);
          return HttpResponse.json({ success: true });
        },
      ),
      http.get(
        "https://api.uploadthing.com/v7/pollUpload",
        // @ts-expect-error - https://github.com/mswjs/msw/pull/2108
        async function* ({ request }) {
          await callRequestSpy(request);
          let file = null;
          const fileKey = request.headers.get("Authorization")!.split(":")[1];

          // Simulate polling - at least once
          yield HttpResponse.json({ status: "not done" });
          if (!file) {
            file = db.getFileByKey(fileKey);
            yield HttpResponse.json({ status: "not done" });
          }

          return HttpResponse.json({
            status: "done",
            file: {
              ...file,
              fileName: file.name,
              fileSize: file.size,
              fileType: file.type,
              fileKey: file.key,
              fileUrl: `https://utfs.io/f/${file.key}`,
            },
            metadata: JSON.parse(file.metadata ?? "{}") as unknown,
          });
        },
      ),
      http.post(
        "https://api.uploadthing.com/v6/requestFileAccess",
        async ({ request }) => {
          await callRequestSpy(request);
          return HttpResponse.json({
            url: "https://utfs.io/f/someFileKey?x-some-amz=query-param",
          });
        },
      ),
      http.post(
        "https://api.uploadthing.com/v6/serverCallback",
        async ({ request }) => {
          await callRequestSpy(request);
          return HttpResponse.json({ status: "ok" });
        },
      ),
      http.post(
        "https://api.uploadthing.com/v6/updateACL",
        async ({ request }) => {
          await callRequestSpy(request);
          return HttpResponse.json({ success: true });
        },
      ),
    );
    await use(db); // provide test context
    files.length = 0; // clear files after each test
  },
});

/**
 * Call this in your test to make the S3 requests fail
 */
export const useBadS3 = () =>
  msw.use(
    http.post("https://bucket.s3.amazonaws.com", async ({ request }) => {
      await callRequestSpy(request);
      return new HttpResponse(null, { status: 403 });
    }),
    http.put("https://bucket.s3.amazonaws.com/:key", async ({ request }) => {
      await callRequestSpy(request);
      return new HttpResponse(null, { status: 204 });
    }),
  );

export const useBadUTApi = () =>
  msw.use(
    http.post("https://api.uploadthing.com/*", async () => {
      return HttpResponse.json({ error: "Not found" }, { status: 404 });
    }),
  );

/**
 * Call this in your test to make the S3 requests fail a couple times before succeeding
 */
export const useHalfBadS3 = () =>
  msw.use(
    http.post(
      "https://bucket.s3.amazonaws.com",
      // @ts-expect-error - https://github.com/mswjs/msw/pull/2108
      async function* ({ request }) {
        await callRequestSpy(request);
        yield new HttpResponse(null, { status: 403 });
        return new HttpResponse();
      },
    ),
    http.put(
      "https://bucket.s3.amazonaws.com/:key",
      // @ts-expect-error - https://github.com/mswjs/msw/pull/2108
      async function* ({ request }) {
        await callRequestSpy(request);
        yield new HttpResponse(null, { status: 403 });
        return new HttpResponse(null, {
          status: 204,
          headers: { ETag: "abc123" },
        });
      },
    ),
  );
