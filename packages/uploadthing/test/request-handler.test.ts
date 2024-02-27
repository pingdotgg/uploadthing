import { describe, expect, it } from "vitest";
import { z } from "zod";

import { createRouteHandler, createUploadthing } from "../src/server";
import {
  baseHeaders,
  createApiUrl,
  fetchMock,
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

const handlers = createRouteHandler({
  router,
  config: {
    uploadthingSecret: "sk_live_test123",
    // @ts-expect-error - annoying to see error logs
    logLevel: "silent",
    fetch: mockExternalRequests,
  },
});

describe("errors for invalid request input", () => {
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
    await expect(res.json()).resolves.toEqual({
      message: "No file route found for slug i-dont-exist",
    });
  });

  it("400s for invalid action type", async () => {
    const res = await handlers.POST(
      // @ts-expect-error - invalid is not a valid action type
      new Request(createApiUrl("imageUploader", "invalid"), {
        method: "POST",
        headers: baseHeaders,
        body: JSON.stringify({
          files: [{ name: "foo.txt", size: 48 }],
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
    await expect(res.json()).resolves.toEqual({
      cause: "Error: File type text not allowed for foo.txt",
      message: "Invalid config",
    });
  });

  it("CURR HANDLED ON INFRA SIDE - blocks for too big files", async () => {
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
    await expect(res.json()).resolves.toEqual({
      cause:
        "Error: You uploaded a image file that was 3.15MB, but the limit for that type is 2MB",
      message: "File size mismatch",
    });
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
    await expect(res.json()).resolves.toEqual({
      cause:
        "Error: You uploaded 2 files of type 'image', but the limit for that type is 1",
      message: "File count exceeded",
    });
  });
});

describe(".input()", () => {
  it("blocks when input is missing", async () => {
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
    await expect(res.json()).resolves.toEqual({
      message: "Invalid input",
      cause: {
        fieldErrors: {},
        formErrors: ["Required"],
      },
    });
  });

  it("blocks when input doesn't match schema", async () => {
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
    await expect(res.json()).resolves.toEqual({
      message: "Invalid input",
      cause: {
        fieldErrors: {
          foo: ["Invalid enum value. Expected 'BAR' | 'BAZ', received 'QUX'"],
        },
        formErrors: [],
      },
    });
  });

  it("forwards input to middleware", async () => {
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
});

describe(".middleware()", () => {
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
    await expect(res.json()).resolves.toEqual({
      cause:
        'TypeError: Headers.get: "i dont exist" is an invalid header name.',
      message: "Failed to run middleware",
    });
  });
});

describe(".onUploadComplete()", () => {
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
    expect(uploadCompleteMock).toHaveBeenCalledOnce();
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
});
