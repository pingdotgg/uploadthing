import { beforeEach, expect, it, vi } from "vitest";
import { z } from "zod";

import { createRouteHandler, createUploadthing } from "../src/server";
import {
  baseHeaders,
  createApiUrl,
  fetchMock,
  mockExternalRequests,
} from "./__test-helpers";

const f = createUploadthing({
  errorFormatter: (e) => ({
    message: e.message,
    cause: (e.cause as Error)?.toString(),
  }),
});

const middlewareMock = vi.fn();
const uploadCompleteMock = vi.fn();
beforeEach(() => {
  middlewareMock.mockClear();
  uploadCompleteMock.mockClear();
});

const router = {
  middlewareThrows: f({ blob: {} })
    .middleware((opts) => {
      middlewareMock(opts);

      if (!opts.req.headers.get("i dont exist"))
        throw new Error("didn't get header");
      return { should: "never return" };
    })
    .onUploadComplete(uploadCompleteMock),

  imageUploader: f({
    image: { maxFileCount: 1, maxFileSize: "2MB" },
  })
    .middleware((opts) => {
      middlewareMock(opts);
      return {};
    })
    .onUploadComplete(uploadCompleteMock),

  withInput: f({ blob: {} })
    .input(z.object({ foo: z.enum(["BAR", "BAZ"]) }))
    .middleware((opts) => {
      middlewareMock(opts);
      return {};
    })
    .onUploadComplete(uploadCompleteMock),
};

const handlers = createRouteHandler({
  router,
  config: {
    uploadthingSecret: "sk_live_test123",
    logLevel: "silent",
    fetch: mockExternalRequests,
  },
});

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

it("forwards files to middleware", async () => {
  const res = await handlers.POST(
    new Request(createApiUrl("imageUploader", "upload"), {
      method: "POST",
      headers: baseHeaders,
      body: JSON.stringify({
        files: [{ name: "foo.png", size: 48 }],
      }),
    }),
  );

  expect(middlewareMock).toBeCalledTimes(1);
  expect(middlewareMock).toHaveBeenCalledWith(
    expect.objectContaining({
      files: [{ name: "foo.png", size: 48 }],
    }),
  );

  expect(res.status).toBe(200);
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

  expect(middlewareMock).toBeCalledTimes(1);
  expect(middlewareMock).toHaveBeenCalledWith(
    expect.objectContaining({
      input: undefined,
      files: [{ name: "foo.txt", size: 48 }],
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

  expect(middlewareMock).toHaveBeenCalledTimes(0);
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

  expect(middlewareMock).toHaveBeenCalledTimes(0);
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

it("fowards input to middleware", async () => {
  const res = await handlers.POST(
    new Request(createApiUrl("withInput", "upload"), {
      method: "POST",
      headers: baseHeaders,
      body: JSON.stringify({
        files: [{ name: "foo.txt", size: 48 }],
        input: { foo: "BAR" },
      }),
    }),
  );
  expect(res.status).toBe(200);

  expect(middlewareMock).toHaveBeenCalledWith(
    expect.objectContaining({
      input: { foo: "BAR" },
    }),
  );
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

it("forwards correct args to onUploadComplete handler", async () => {
  const res = await handlers.POST(
    new Request(createApiUrl("imageUploader"), {
      method: "POST",
      headers: {
        "uploadthing-hook": "callback",
      },
      body: JSON.stringify({
        status: "uploaded",
        metadata: {},
        file: {
          url: "https://utfs.io/f/some-random-key.png",
          name: "foo.png",
          key: "some-random-key.png",
          size: 48,
          customId: null,
        },
      }),
    }),
  );

  expect(res.status).toBe(200);
  // await expect(res.json()).resolves.toBe(null);
  expect(uploadCompleteMock).toHaveBeenCalledTimes(1);
  expect(uploadCompleteMock).toHaveBeenCalledWith({
    file: {
      customId: null,
      key: "some-random-key.png",
      name: "foo.png",
      size: 48,
      url: "https://utfs.io/f/some-random-key.png",
    },
    metadata: {},
  });
});
