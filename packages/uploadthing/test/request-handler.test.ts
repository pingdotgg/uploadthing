import { describe, expect } from "vitest";
import { z } from "zod";

import { signPayload } from "@uploadthing/shared";

import { createRouteHandler, createUploadthing } from "../src/server";
import type { UploadedFileData } from "../src/types";
import {
  baseHeaders,
  createApiUrl,
  it,
  middlewareMock,
  requestSpy,
  uploadCompleteMock,
  useBadUTApi,
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

  withMinInput: f({
    image: {
      maxFileCount: 2,
      minFileCount: 2,
    },
  })
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
    logLevel: "debug",
    // logLevel: "silent",
  },
});

describe("errors for invalid request input", () => {
  it("404s for invalid slugs", async ({ db }) => {
    const res = await handlers.POST(
      new Request(createApiUrl("i-dont-exist", "upload"), {
        method: "POST",
        headers: baseHeaders,
        body: JSON.stringify({
          files: [{ name: "foo.txt", size: 48, type: "text/plain" }],
        }),
      }),
    );

    expect(requestSpy).toHaveBeenCalledTimes(0);
    expect(res.status).toBe(404);
    await expect(res.json()).resolves.toEqual({
      message: "No file route found for slug i-dont-exist",
    });
  });

  it("400s for invalid action type", async ({ db }) => {
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

    expect(requestSpy).toHaveBeenCalledTimes(0);
    expect(res.status).toBe(400);
    await expect(res.json()).resolves.toEqual({
      cause: "Error: Invalid action type invalid",
      message:
        'Expected "upload", "failure" or "multipart-complete" but got "invalid"',
    });
  });
});

describe("file route config", () => {
  it("blocks unmatched file types", async ({ db }) => {
    const res = await handlers.POST(
      new Request(createApiUrl("imageUploader", "upload"), {
        method: "POST",
        headers: baseHeaders,
        body: JSON.stringify({
          files: [{ name: "foo.txt", size: 48, type: "text/plain" }],
        }),
      }),
    );

    expect(requestSpy).toHaveBeenCalledTimes(0);
    expect(res.status).toBe(400);
    await expect(res.json()).resolves.toEqual({
      cause: "Error: File type text not allowed for foo.txt",
      message: "Invalid config: InvalidFileType",
    });
  });

  it("blocks for too big files", async ({ db }) => {
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

    expect(requestSpy).toHaveBeenCalledTimes(0);
    expect(res.status).toBe(400);
    await expect(res.json()).resolves.toEqual({
      cause:
        "Error: You uploaded a image file that was 3.15MB, but the limit for that type is 2MB",
      message: "Invalid config: FileSizeMismatch",
    });
  });

  it("blocks for too many files", async ({ db }) => {
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

    expect(requestSpy).toHaveBeenCalledTimes(0);
    expect(res.status).toBe(400);
    await expect(res.json()).resolves.toEqual({
      cause:
        "Error: You uploaded 2 file(s) of type 'image', but the maximum for that type is 1",
      message: "Invalid config: FileCountMismatch",
    });
  });

  it("blocks for too few files", async ({ db }) => {
    const res = await handlers.POST(
      new Request(createApiUrl("withMinInput", "upload"), {
        method: "POST",
        headers: baseHeaders,
        body: JSON.stringify({
          files: [{ name: "foo.png", size: 48, type: "image/png" }],
        }),
      }),
    );

    expect(requestSpy).toHaveBeenCalledTimes(0);
    expect(res.status).toBe(400);
    await expect(res.json()).resolves.toEqual({
      cause:
        "Error: You uploaded 1 file(s) of type 'image', but the minimum for that type is 2",
      message: "Invalid config: FileCountMismatch",
    });
  });
});

describe(".input()", () => {
  it("blocks when input is missing", async ({ db }) => {
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
    expect(requestSpy).toHaveBeenCalledTimes(0);
    expect(res.status).toBe(400);
    await expect(res.json()).resolves.toEqual({
      message: "Invalid input",
      cause: {
        fieldErrors: {},
        formErrors: ["Required"],
      },
    });
  });

  it("blocks when input doesn't match schema", async ({ db }) => {
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
    expect(requestSpy).toHaveBeenCalledTimes(0);
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

  it("forwards input to middleware", async ({ db }) => {
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
  it("forwards files to middleware", async ({ db }) => {
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

  it("early exits if middleware throws", async ({ db }) => {
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

    expect(requestSpy).toHaveBeenCalledTimes(0);
    expect(res.status).toBe(500);
    await expect(res.json()).resolves.toEqual({
      cause:
        'TypeError: Headers.get: "i dont exist" is an invalid header name.',
      message: "Failed to run middleware",
    });
  });
});

describe(".onUploadComplete()", () => {
  it("forwards correct args to onUploadComplete handler", async ({ db }) => {
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

  it("is blocked on missing signature", async ({ db }) => {
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

  it("is blocked on invalid signature", async ({ db }) => {
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

describe("bad request handling", () => {
  it("throws a more descriptive error instead of ParseError for bad request", async ({
    db,
  }) => {
    useBadUTApi();

    const res = await handlers.POST(
      new Request(createApiUrl("imageUploader", "upload"), {
        method: "POST",
        headers: baseHeaders,
        body: JSON.stringify({
          files: [{ name: "foo.png", size: 48, type: "image/png" }],
        }),
      }),
    );
    expect(res.status).toBe(500);
    await expect(res.json()).resolves.toEqual({
      message:
        'Request to https://uploadthing.com/api/prepareUpload failed with status 404: {"error":"Not found"}',
      cause: "FetchError",
    });
  });
});
