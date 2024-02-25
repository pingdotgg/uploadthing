/* eslint-disable @typescript-eslint/no-empty-function */
import { beforeEach, expect, expectTypeOf, it, vi } from "vitest";
import { z } from "zod";

import { UPLOADTHING_VERSION } from "uploadthing/constants";

import { createAPIRequestUrl } from "../src/internal/ut-reporter";
import type { ActionType } from "../src/server";
import { createRouteHandler, createUploadthing } from "../src/server";

const f = createUploadthing({
  errorFormatter: (e) => ({
    message: e.message,
    cause: (e.cause as Error)?.toString(),
  }),
});
const router = {
  middlewareThrows: f({ blob: {} })
    .middleware((opts) => {
      expect(opts.req).toBeInstanceOf(Request);
      expectTypeOf<Request>(opts.req);

      expect(opts.event).toBeUndefined();
      expectTypeOf<undefined>(opts.event);

      expect(opts.res).toBeUndefined();
      expectTypeOf<undefined>(opts.res);

      //   expect(opts.input).toBeUndefined();
      expectTypeOf<undefined>(opts.input);

      if (!opts.req.headers.get("i dont exist"))
        throw new Error("didn't get header");
      return { should: "never return" };
    })
    .onUploadComplete(() => {}),

  imageUploader: f({
    image: { maxFileCount: 1, maxFileSize: "2MB" },
  }).onUploadComplete(() => {}),

  withInput: f({ blob: {} })
    .input(z.object({ foo: z.enum(["BAR", "BAZ"]) }))
    .onUploadComplete(() => {}),
};

const fetchMock = vi.fn();
const handlers = createRouteHandler({
  router,
  config: {
    uploadthingSecret: "sk_live_test123",
    logLevel: "silent",
    fetch: async (_url, init) => {
      fetchMock(_url, init);
      if (typeof _url !== "string") throw new Error("eh?");

      // If request is going to uploadthing, mock the response
      const url = new URL(_url);
      if (url.host === "uploadthing.com") {
        switch (url.pathname) {
          case "/api/prepareUpload": {
            return Response.json({});
          }
          case "/api/completeMultipart": {
            return Response.json({});
          }
        }
      }

      // Else forward the request
      // eslint-disable-next-line no-restricted-globals
      return fetch(url, init);
    },
  },
});
beforeEach(() => fetchMock.mockClear());

const createApiUrl = (slug: string, action: ActionType) =>
  createAPIRequestUrl({
    url: new URL("https://not-used.com"),
    slug,
    actionType: action,
  });
const baseHeaders = {
  "x-uploadthing-version": UPLOADTHING_VERSION,
  "x-uploadthing-package": "vitest",
};

it("404s for invalid slugs", async () => {
  const res = await handlers.POST(
    new Request(createApiUrl("i-dont-exist", "upload"), {
      method: "POST",
      headers: baseHeaders,
      body: JSON.stringify({
        files: [{ name: "foo.txt", size: 48 }],
      }),
    }),
  );

  expect(fetchMock).toHaveBeenCalledTimes(0);
  expect(res.status).toBe(404);
  await expect(res.json()).resolves.toMatchInlineSnapshot(`
    {
      "message": "No file route found for slug i-dont-exist",
    }
  `);
});

it("early exits if middleware throws", async () => {
  const res = await handlers.POST(
    new Request(createApiUrl("middlewareThrows", "upload"), {
      method: "POST",
      headers: baseHeaders,
      body: JSON.stringify({
        files: [{ name: "foo.txt", size: 48 }],
      }),
    }),
  );

  expect(fetchMock).toHaveBeenCalledTimes(0);
  expect(res.status).toBe(500);
  await expect(res.json()).resolves.toMatchInlineSnapshot(`
    {
      "cause": "TypeError: Headers.get: "i dont exist" is an invalid header name.",
      "message": "Failed to run middleware.",
    }
  `);
});

it("blocks unmatched file types", async () => {
  const res = await handlers.POST(
    new Request(createApiUrl("imageUploader", "upload"), {
      method: "POST",
      headers: baseHeaders,
      body: JSON.stringify({
        files: [{ name: "foo.txt", size: 48 }],
      }),
    }),
  );

  expect(fetchMock).toHaveBeenCalledTimes(0);
  expect(res.status).toBe(400);
  await expect(res.json()).resolves.toMatchInlineSnapshot(`
    {
      "cause": "Error: File type text not allowed for foo.txt",
      "message": "Invalid config.",
    }
  `);
});

it("blocks missing input", async () => {
  const res = await handlers.POST(
    new Request(createApiUrl("withInput", "upload"), {
      method: "POST",
      headers: baseHeaders,
      body: JSON.stringify({
        files: [{ name: "foo.txt", size: 48 }],
      }),
    }),
  );

  expect(fetchMock).toHaveBeenCalledTimes(0);
  expect(res.status).toBe(400);
  await expect(res.json()).resolves.toMatchInlineSnapshot(`
    {
      "cause": "[
      {
        "code": "invalid_type",
        "expected": "object",
        "received": "undefined",
        "path": [],
        "message": "Required"
      }
    ]",
      "message": "Invalid input.",
    }
  `);
});

it("blocks invalid input", async () => {
  const res = await handlers.POST(
    new Request(createApiUrl("withInput", "upload"), {
      method: "POST",
      headers: baseHeaders,
      body: JSON.stringify({
        files: [{ name: "foo.txt", size: 48 }],
        input: { foo: "QUX" },
      }),
    }),
  );

  expect(fetchMock).toHaveBeenCalledTimes(0);
  expect(res.status).toBe(400);
  await expect(res.json()).resolves.toMatchInlineSnapshot(`
    {
      "cause": "[
      {
        "received": "QUX",
        "code": "invalid_enum_value",
        "options": [
          "BAR",
          "BAZ"
        ],
        "path": [
          "foo"
        ],
        "message": "Invalid enum value. Expected 'BAR' | 'BAZ', received 'QUX'"
      }
    ]",
      "message": "Invalid input.",
    }
  `);
});

it.skip("CURR HANDLED ON INFRA SIDE - blocks for too big files", async () => {
  const res = await handlers.POST(
    new Request(createApiUrl("imageUploader", "upload"), {
      method: "POST",
      headers: baseHeaders,
      body: JSON.stringify({
        files: [{ name: "foo.png", size: 3 * 1024 * 1024 }],
      }),
    }),
  );

  expect(fetchMock).toHaveBeenCalledTimes(0);
  expect(res.status).toBe(400);
  await expect(res.json()).resolves.toMatchInlineSnapshot();
});

it("blocks for too many files", async () => {
  const res = await handlers.POST(
    new Request(createApiUrl("imageUploader", "upload"), {
      method: "POST",
      headers: baseHeaders,
      body: JSON.stringify({
        files: [
          { name: "foo.png", size: 48 },
          { name: "bar.png", size: 64 },
        ],
      }),
    }),
  );

  expect(fetchMock).toHaveBeenCalledTimes(0);
  expect(res.status).toBe(400);
  await expect(res.json()).resolves.toMatchInlineSnapshot(`
    {
      "cause": "Error: You uploaded 2 files of type 'image', but the limit for that type is 1",
      "message": "File limit exceeded",
    }
  `);
});
