import { describe, expect } from "vitest";
import { z } from "zod";

import { signPayload } from "@uploadthing/shared";

import { createRouteHandler, createUploadthing } from "../src/server";
import type { UploadedFileData } from "../src/types";
import {
  baseHeaders,
  createApiUrl,
  fetchMock,
  it as itBase,
  middlewareMock,
  mockExternalRequests,
  uploadCompleteMock,
} from "./__test-helpers";

const f = createUploadthing({
  errorFormatter: (e) => ({
    message: e.message,
    cause:
      e.cause instanceof z.ZodError
        ? e.cause.flatten()
        : (e.cause as Error)?.toString(),
  }),
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

const it = itBase.extend<{ handlers: ReturnType<typeof createRouteHandler> }>({
  handlers: async ({ db }, use) => {
    await use(
      createRouteHandler({
        router,
        config: {
          uploadthingSecret: "sk_live_test123",
          // @ts-expect-error - annoying to see error logs
          logLevel: "silent",
          fetch: mockExternalRequests(db),
        },
      }),
    );
  },
});

describe("errors for invalid request input", () => {
  it("404s for invalid slugs", async ({ handlers }) => {
    const res = await handlers.POST(
      new Request(createApiUrl("i-dont-exist", "upload"), {
        method: "POST",
        headers: baseHeaders,
        body: JSON.stringify({
          files: [{ name: "foo.txt", size: 48, type: "text/plain" }],
        }),
      }),
    );

    expect(fetchMock).toHaveBeenCalledTimes(0);
    expect(res.status).toBe(404);
    await expect(res.json()).resolves.toEqual({
      message: "No file route found for slug i-dont-exist",
    });
  });

  it("400s for invalid action type", async ({ handlers }) => {
    const res = await handlers.POST(
      // @ts-expect-error - invalid is not a valid action type
      new Request(createApiUrl("imageUploader", "invalid"), {
        method: "POST",
        headers: baseHeaders,
        body: JSON.stringify({
          files: [{ name: "foo.txt", size: 48, type: "text/plain" }],
        }),
      }),
    );

    expect(fetchMock).toHaveBeenCalledTimes(0);
    expect(res.status).toBe(400);
    await expect(res.json()).resolves.toEqual({
      cause: "Error: Invalid action type invalid",
      message:
        'Expected "upload", "failure" or "multipart-complete" but got "invalid"',
    });
  });
});

describe("file route config", () => {
  it("blocks unmatched file types", async ({ handlers }) => {
    const res = await handlers.POST(
      new Request(createApiUrl("imageUploader", "upload"), {
        method: "POST",
        headers: baseHeaders,
        body: JSON.stringify({
          files: [{ name: "foo.txt", size: 48, type: "text/plain" }],
        }),
      }),
    );

    expect(fetchMock).toHaveBeenCalledTimes(0);
    expect(res.status).toBe(400);
    await expect(res.json()).resolves.toEqual({
      cause: "Error: File type text not allowed for foo.txt",
      message: "Invalid config.",
    });
  });

  it.skip("CURR HANDLED ON INFRA SIDE - blocks for too big files", async ({
    handlers,
  }) => {
    const res = await handlers.POST(
      new Request(createApiUrl("imageUploader", "upload"), {
        method: "POST",
        headers: baseHeaders,
        body: JSON.stringify({
          files: [
            { name: "foo.png", size: 3 * 1024 * 1024, type: "image/png" },
          ],
        }),
      }),
    );

    expect(fetchMock).toHaveBeenCalledTimes(0);
    expect(res.status).toBe(400);
    await expect(res.json()).resolves.toEqual({});
  });

  it("blocks for too many files", async ({ handlers }) => {
    const res = await handlers.POST(
      new Request(createApiUrl("imageUploader", "upload"), {
        method: "POST",
        headers: baseHeaders,
        body: JSON.stringify({
          files: [
            { name: "foo.png", size: 48, type: "image/png" },
            { name: "bar.png", size: 64, type: "image/png" },
          ],
        }),
      }),
    );

    expect(fetchMock).toHaveBeenCalledTimes(0);
    expect(res.status).toBe(400);
    await expect(res.json()).resolves.toEqual({
      cause:
        "Error: You uploaded 2 files of type 'image', but the limit for that type is 1",
      message: "File limit exceeded",
    });
  });
});

describe(".input()", () => {
  it("blocks when input is missing", async ({ handlers }) => {
    const res = await handlers.POST(
      new Request(createApiUrl("withInput", "upload"), {
        method: "POST",
        headers: baseHeaders,
        body: JSON.stringify({
          files: [{ name: "foo.txt", size: 48, type: "text/plain" }],
        }),
      }),
    );

    expect(middlewareMock).toHaveBeenCalledTimes(0);
    expect(fetchMock).toHaveBeenCalledTimes(0);
    expect(res.status).toBe(400);
    await expect(res.json()).resolves.toEqual({
      message: "Invalid input.",
      cause: {
        fieldErrors: {},
        formErrors: ["Required"],
      },
    });
  });

  it("blocks when input doesn't match schema", async ({ handlers }) => {
    const res = await handlers.POST(
      new Request(createApiUrl("withInput", "upload"), {
        method: "POST",
        headers: baseHeaders,
        body: JSON.stringify({
          files: [{ name: "foo.txt", size: 48, type: "text/plain" }],
          input: { foo: "QUX" },
        }),
      }),
    );

    expect(middlewareMock).toHaveBeenCalledTimes(0);
    expect(fetchMock).toHaveBeenCalledTimes(0);
    expect(res.status).toBe(400);
    await expect(res.json()).resolves.toEqual({
      message: "Invalid input.",
      cause: {
        fieldErrors: {
          foo: ["Invalid enum value. Expected 'BAR' | 'BAZ', received 'QUX'"],
        },
        formErrors: [],
      },
    });
  });

  it("forwards input to middleware", async ({ handlers }) => {
    const res = await handlers.POST(
      new Request(createApiUrl("withInput", "upload"), {
        method: "POST",
        headers: baseHeaders,
        body: JSON.stringify({
          files: [{ name: "foo.txt", size: 48, type: "text/plain" }],
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
});

describe(".middleware()", () => {
  it("forwards files to middleware", async ({ handlers }) => {
    const res = await handlers.POST(
      new Request(createApiUrl("imageUploader", "upload"), {
        method: "POST",
        headers: baseHeaders,
        body: JSON.stringify({
          files: [{ name: "foo.png", size: 48, type: "image/png" }],
        }),
      }),
    );

    expect(middlewareMock).toBeCalledTimes(1);
    expect(middlewareMock).toHaveBeenCalledWith(
      expect.objectContaining({
        files: [{ name: "foo.png", size: 48, type: "image/png" }],
      }),
    );

    expect(res.status).toBe(200);
  });

  it("early exits if middleware throws", async ({ handlers }) => {
    const res = await handlers.POST(
      new Request(createApiUrl("middlewareThrows", "upload"), {
        method: "POST",
        headers: baseHeaders,
        body: JSON.stringify({
          files: [{ name: "foo.txt", size: 48, type: "text/plain" }],
        }),
      }),
    );

    expect(middlewareMock).toBeCalledTimes(1);
    expect(middlewareMock).toHaveBeenCalledWith(
      expect.objectContaining({
        input: undefined,
        files: [{ name: "foo.txt", size: 48, type: "text/plain" }],
      }),
    );

    expect(fetchMock).toHaveBeenCalledTimes(0);
    expect(res.status).toBe(500);
    await expect(res.json()).resolves.toEqual({
      cause:
        'TypeError: Headers.get: "i dont exist" is an invalid header name.',
      message: "Failed to run middleware.",
    });
  });
});

describe(".onUploadComplete()", () => {
  it("forwards correct args to onUploadComplete handler", async ({
    handlers,
  }) => {
    const payload = JSON.stringify({
      status: "uploaded",
      metadata: {},
      file: {
        url: "https://utfs.io/f/some-random-key.png",
        name: "foo.png",
        key: "some-random-key.png",
        size: 48,
        type: "image/png",
        customId: null,
      } satisfies UploadedFileData,
    });
    const signature = await signPayload(payload, "sk_live_test123");

    const res = await handlers.POST(
      new Request(createApiUrl("imageUploader"), {
        method: "POST",
        headers: {
          "uploadthing-hook": "callback",
          "x-uploadthing-signature": signature,
        },
        body: payload,
      }),
    );

    expect(res.status).toBe(200);
    await expect(res.json()).resolves.toBe(null);
    expect(uploadCompleteMock).toHaveBeenCalledOnce();
    expect(uploadCompleteMock).toHaveBeenCalledWith({
      file: {
        customId: null,
        key: "some-random-key.png",
        name: "foo.png",
        size: 48,
        type: "image/png",
        url: "https://utfs.io/f/some-random-key.png",
      },
      metadata: {},
    });
  });

  it("is blocked on missing signature", async ({ handlers }) => {
    const payload = JSON.stringify({
      status: "uploaded",
      metadata: {},
      file: {
        url: "https://utfs.io/f/some-random-key.png",
        name: "foo.png",
        key: "some-random-key.png",
        size: 48,
        type: "image/png",
        customId: null,
      } satisfies UploadedFileData,
    });

    const res = await handlers.POST(
      new Request(createApiUrl("imageUploader"), {
        method: "POST",
        headers: {
          "uploadthing-hook": "callback",
        },
        body: payload,
      }),
    );

    expect(res.status).toBe(400);
    await expect(res.json()).resolves.toEqual({
      message: "Invalid signature",
    });
    expect(uploadCompleteMock).not.toHaveBeenCalled();
  });

  it("is blocked on invalid signature", async ({ handlers }) => {
    const payload = JSON.stringify({
      status: "uploaded",
      metadata: {},
      file: {
        url: "https://utfs.io/f/some-random-key.png",
        name: "foo.png",
        key: "some-random-key.png",
        size: 48,
        type: "image/png",
        customId: null,
      } satisfies UploadedFileData,
    });
    const signature = await signPayload(payload, "sk_live_badkey");

    const res = await handlers.POST(
      new Request(createApiUrl("imageUploader"), {
        method: "POST",
        headers: {
          "uploadthing-hook": "callback",
          "x-uploadthing-signature": signature,
        },
        body: payload,
      }),
    );

    expect(res.status).toBe(400);
    await expect(res.json()).resolves.toEqual({
      message: "Invalid signature",
    });
    expect(uploadCompleteMock).not.toHaveBeenCalled();
  });
});
