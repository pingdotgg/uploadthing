/* eslint-disable @typescript-eslint/no-unsafe-return */
/* eslint-disable @typescript-eslint/no-unsafe-argument */

/* eslint-disable @typescript-eslint/no-unsafe-member-access */
/* eslint-disable @typescript-eslint/no-unsafe-assignment */

import EventEmitter from "events";
import type { NextApiRequest, NextApiResponse } from "next";
import { NextRequest } from "next/server";
import { createApp, H3Event, toWebHandler } from "h3";
import { describe, expect, expectTypeOf, it, vi } from "vitest";

import {
  baseHeaders,
  createApiUrl,
  fetchMock,
  middlewareMock,
  mockExternalRequests,
  uploadCompleteMock,
} from "./__test-helpers";

describe("adapters:h3", async () => {
  const { createUploadthing, createRouteHandler } = await import("../src/h3");
  const f = createUploadthing();

  const router = {
    middleware: f({ blob: {} })
      .middleware((opts) => {
        middlewareMock(opts);
        expect(opts.event).toBeInstanceOf(H3Event);
        expectTypeOf<{
          event: H3Event;
          req: undefined;
          res: undefined;
        }>(opts);

        return {};
      })
      .onUploadComplete(uploadCompleteMock),
  };

  const eventHandler = createRouteHandler({
    router,
    config: {
      uploadthingSecret: "sk_live_test",
      fetch: mockExternalRequests,
    },
  });

  it("gets H3Event in middleware args", async () => {
    // FIXME: Didn't know how to declaratively create a H3Event to
    // call the handler with directly, so I used the web-handler converter
    // and sent in a Request and let H3 create one for me 🤷‍♂️
    const res = await toWebHandler(createApp().use(eventHandler))(
      new Request(createApiUrl("middleware", "upload"), {
        method: "POST",
        headers: baseHeaders,
        body: JSON.stringify({
          files: [{ name: "foo.txt", size: 48 }],
        }),
      }),
    );
    expect(res.status).toBe(200);

    // Should proceed to have requested URLs
    expect(fetchMock).toHaveBeenCalledTimes(1);
    expect(fetchMock).toHaveBeenCalledWith(
      "https://uploadthing.com/api/prepareUpload",
      {
        body: '{"files":[{"name":"foo.txt","size":48}],"routeConfig":{"blob":{"maxFileSize":"8MB","maxFileCount":1,"contentDisposition":"inline"}},"metadata":{},"callbackUrl":"https://not-used.com/","callbackSlug":"middleware"}',
        headers: {
          "Content-Type": "application/json",
          "x-uploadthing-api-key": "sk_live_test",
          "x-uploadthing-be-adapter": "h3",
          "x-uploadthing-fe-package": "vitest",
          "x-uploadthing-version": expect.stringMatching(/\d+\.\d+\.\d+/),
        },
        method: "POST",
      },
    );
  });
});

describe("adapters:server", async () => {
  const { createUploadthing, createRouteHandler } = await import(
    "../src/server"
  );
  const f = createUploadthing();

  const router = {
    middleware: f({ blob: {} })
      .middleware((opts) => {
        middlewareMock(opts);
        expect(opts.req).toBeInstanceOf(Request);
        expectTypeOf<{
          event: undefined;
          req: Request;
          res: undefined;
        }>(opts);

        return {};
      })
      .onUploadComplete(uploadCompleteMock),
  };

  const handlers = createRouteHandler({
    router,
    config: {
      uploadthingSecret: "sk_live_test",
      fetch: mockExternalRequests,
    },
  });

  it("gets NextRequest in middleware args", async () => {
    const res = await handlers.POST(
      new Request(createApiUrl("middleware", "upload"), {
        method: "POST",
        headers: baseHeaders,
        body: JSON.stringify({
          files: [{ name: "foo.txt", size: 48 }],
        }),
      }),
    );
    expect(res.status).toBe(200);

    // Should proceed to have requested URLs
    expect(fetchMock).toHaveBeenCalledTimes(1);
    expect(fetchMock).toHaveBeenCalledWith(
      "https://uploadthing.com/api/prepareUpload",
      {
        body: '{"files":[{"name":"foo.txt","size":48}],"routeConfig":{"blob":{"maxFileSize":"8MB","maxFileCount":1,"contentDisposition":"inline"}},"metadata":{},"callbackUrl":"https://not-used.com/","callbackSlug":"middleware"}',
        headers: {
          "Content-Type": "application/json",
          "x-uploadthing-api-key": "sk_live_test",
          "x-uploadthing-be-adapter": "server",
          "x-uploadthing-fe-package": "vitest",
          "x-uploadthing-version": expect.stringMatching(/\d+\.\d+\.\d+/),
        },
        method: "POST",
      },
    );
  });
});

describe("adapters:next", async () => {
  const { createUploadthing, createRouteHandler } = await import("../src/next");
  const f = createUploadthing();

  const router = {
    middleware: f({ blob: {} })
      .middleware((opts) => {
        middlewareMock(opts);
        expect(opts.req).toBeInstanceOf(NextRequest);
        expectTypeOf<{
          event: undefined;
          req: NextRequest;
          res: undefined;
        }>(opts);

        return {};
      })
      .onUploadComplete(uploadCompleteMock),
  };

  const handlers = createRouteHandler({
    router,
    config: {
      uploadthingSecret: "sk_live_test",
      fetch: mockExternalRequests,
    },
  });

  it("gets NextRequest in middleware args", async () => {
    const res = await handlers.POST(
      new NextRequest(createApiUrl("middleware", "upload"), {
        method: "POST",
        headers: baseHeaders,
        body: JSON.stringify({
          files: [{ name: "foo.txt", size: 48 }],
        }),
      }),
    );
    expect(res.status).toBe(200);

    // Should proceed to have requested URLs
    expect(fetchMock).toHaveBeenCalledTimes(1);
    expect(fetchMock).toHaveBeenCalledWith(
      "https://uploadthing.com/api/prepareUpload",
      {
        body: '{"files":[{"name":"foo.txt","size":48}],"routeConfig":{"blob":{"maxFileSize":"8MB","maxFileCount":1,"contentDisposition":"inline"}},"metadata":{},"callbackUrl":"https://not-used.com/","callbackSlug":"middleware"}',
        headers: {
          "Content-Type": "application/json",
          "x-uploadthing-api-key": "sk_live_test",
          "x-uploadthing-be-adapter": "nextjs-app",
          "x-uploadthing-fe-package": "vitest",
          "x-uploadthing-version": expect.stringMatching(/\d+\.\d+\.\d+/),
        },
        method: "POST",
      },
    );
  });
});

describe("adapters:next-legacy", async () => {
  const { createUploadthing, createRouteHandler } = await import(
    "../src/next-legacy"
  );
  const f = createUploadthing();

  const router = {
    middleware: f({ blob: {} })
      .middleware((opts) => {
        middlewareMock(opts);
        expect(opts.req).toHaveProperty("query");
        expect(opts.res).toHaveProperty("json");
        expectTypeOf<{
          event: undefined;
          req: NextApiRequest;
          res: NextApiResponse;
        }>(opts);

        return {};
      })
      .onUploadComplete(uploadCompleteMock),
  };

  const handler = createRouteHandler({
    router,
    config: {
      uploadthingSecret: "sk_live_test",
      fetch: mockExternalRequests,
    },
  });

  function mockReq(opts: {
    query: Record<string, any>;
    headers?: Record<string, string>;
    method?: string;
    body?: unknown;
  }) {
    const req = new EventEmitter() as any;

    req.url = "/?" + new URLSearchParams(opts.query).toString();
    req.method = opts.method;
    req.query = opts.query;
    req.headers = {
      "x-forwarded-host": "not-used.com",
      "x-forwarded-proto": "https",
      ...opts.headers,
    };
    req.body = opts.body;

    const socket = {
      destroy: vi.fn(),
    };
    req.socket = socket;

    return { req, socket };
  }
  function mockRes() {
    const res = new EventEmitter() as any;

    const json = vi.fn(() => res);
    const setHeader = vi.fn(() => res);
    const status = vi.fn(() => res);
    res.json = json;
    res.setHeader = setHeader;
    res.status = status;

    return { res, json, setHeader, status };
  }

  it("gets NextApiRequest and NextApiResponse in middleware args", async () => {
    const { req } = mockReq({
      query: { slug: "middleware", actionType: "upload" },
      body: {
        files: [{ name: "foo.txt", size: 48 }],
      },
      method: "POST",
      headers: baseHeaders,
    });
    const { res, status } = mockRes();

    await handler(req, res);
    expect(status).toHaveBeenCalledWith(200);

    // Should proceed to have requested URLs
    expect(fetchMock).toHaveBeenCalledTimes(1);
    expect(fetchMock).toHaveBeenCalledWith(
      "https://uploadthing.com/api/prepareUpload",
      {
        body: '{"files":[{"name":"foo.txt","size":48}],"routeConfig":{"blob":{"maxFileSize":"8MB","maxFileCount":1,"contentDisposition":"inline"}},"metadata":{},"callbackUrl":"https://not-used.com/","callbackSlug":"middleware"}',
        headers: {
          "Content-Type": "application/json",
          "x-uploadthing-api-key": "sk_live_test",
          "x-uploadthing-be-adapter": "nextjs-pages",
          "x-uploadthing-fe-package": "vitest",
          "x-uploadthing-version": expect.stringMatching(/\d+\.\d+\.\d+/),
        },
        method: "POST",
      },
    );
  });
});
