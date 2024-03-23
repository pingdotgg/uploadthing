/* eslint-disable no-restricted-globals */
import type { NextApiRequest, NextApiResponse } from "next";
import { NextRequest } from "next/server";
import * as express from "express";
import * as fastify from "fastify";
import { createApp, H3Event, toWebHandler } from "h3";
import { describe, expect, expectTypeOf, vi } from "vitest";

import {
  baseHeaders,
  createApiUrl,
  it,
  middlewareMock,
  uploadCompleteMock,
  utApiMock,
} from "./__test-helpers";

describe("adapters:h3", async () => {
  const { createUploadthing, createRouteHandler } = await import("../src/h3");
  const f = createUploadthing();

  const router = {
    middleware: f({ blob: {} })
      .middleware((opts) => {
        middlewareMock(opts);
        expectTypeOf<{
          event: H3Event;
          req: undefined;
          res: undefined;
        }>(opts);
        return {};
      })
      .onUploadComplete(uploadCompleteMock),
  };

  it("gets H3Event in middleware args", async ({ db }) => {
    const eventHandler = createRouteHandler({
      router,
      config: {
        uploadthingSecret: "sk_live_test",
      },
    });

    // FIXME: Didn't know how to declaratively create a H3Event to
    // call the handler with directly, so I used the web-handler converter
    // and sent in a Request and let H3 create one for me 🤷‍♂️
    const res = await toWebHandler(createApp().use(eventHandler))(
      new Request(createApiUrl("middleware", "upload"), {
        method: "POST",
        headers: baseHeaders,
        body: JSON.stringify({
          files: [{ name: "foo.txt", size: 48, type: "text/plain" }],
        }),
      }),
    );
    expect(res.status).toBe(200);

    expect(middlewareMock).toHaveBeenCalledOnce();
    expect(middlewareMock).toHaveBeenCalledWith(
      expect.objectContaining({
        event: expect.any(H3Event),
        req: undefined,
        res: undefined,
      }),
    );

    // Should proceed to have requested URLs
    expect(utApiMock).toHaveBeenCalledOnce();
    expect(utApiMock).toHaveBeenCalledWith(
      "https://uploadthing.com/api/prepareUpload",
      {
        body: '{"files":[{"name":"foo.txt","size":48}],"routeConfig":{"blob":{"maxFileSize":"8MB","maxFileCount":1,"contentDisposition":"inline"}},"metadata":{},"callbackUrl":"http://localhost:3000/","callbackSlug":"middleware"}',
        headers: {
          "content-type": "application/json",
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
        expectTypeOf<{
          event: undefined;
          req: Request;
          res: undefined;
        }>(opts);
        return {};
      })
      .onUploadComplete(uploadCompleteMock),
  };

  it("gets Request in middleware args", async ({ db }) => {
    const handlers = createRouteHandler({
      router,
      config: {
        uploadthingSecret: "sk_live_test",
      },
    });

    const req = new Request(createApiUrl("middleware", "upload"), {
      method: "POST",
      headers: baseHeaders,
      body: JSON.stringify({
        files: [{ name: "foo.txt", size: 48, type: "text/plain" }],
      }),
    });
    const res = await handlers.POST(req);
    expect(res.status).toBe(200);

    expect(middlewareMock).toHaveBeenCalledOnce();
    expect(middlewareMock).toHaveBeenCalledWith(
      expect.objectContaining({ event: undefined, req, res: undefined }),
    );

    // Should proceed to have requested URLs
    expect(utApiMock).toHaveBeenCalledOnce();
    expect(utApiMock).toHaveBeenCalledWith(
      "https://uploadthing.com/api/prepareUpload",
      {
        body: '{"files":[{"name":"foo.txt","size":48}],"routeConfig":{"blob":{"maxFileSize":"8MB","maxFileCount":1,"contentDisposition":"inline"}},"metadata":{},"callbackUrl":"http://localhost:3000/","callbackSlug":"middleware"}',
        headers: {
          "content-type": "application/json",
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
        expectTypeOf<{
          event: undefined;
          req: NextRequest;
          res: undefined;
        }>(opts);
        return {};
      })
      .onUploadComplete(uploadCompleteMock),
  };

  it("gets NextRequest in middleware args", async ({ db }) => {
    const handlers = createRouteHandler({
      router,
      config: {
        uploadthingSecret: "sk_live_test",
      },
    });

    const req = new NextRequest(createApiUrl("middleware", "upload"), {
      method: "POST",
      headers: baseHeaders,
      body: JSON.stringify({
        files: [{ name: "foo.txt", size: 48, type: "text/plain" }],
      }),
    });
    const res = await handlers.POST(req);
    expect(res.status).toBe(200);

    expect(middlewareMock).toHaveBeenCalledOnce();
    expect(middlewareMock).toHaveBeenCalledWith(
      expect.objectContaining({ event: undefined, req, res: undefined }),
    );
    // Should proceed to have requested URLs
    expect(utApiMock).toHaveBeenCalledOnce();
    expect(utApiMock).toHaveBeenCalledWith(
      "https://uploadthing.com/api/prepareUpload",
      {
        body: '{"files":[{"name":"foo.txt","size":48}],"routeConfig":{"blob":{"maxFileSize":"8MB","maxFileCount":1,"contentDisposition":"inline"}},"metadata":{},"callbackUrl":"http://localhost:3000/","callbackSlug":"middleware"}',
        headers: {
          "content-type": "application/json",
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
        expectTypeOf<{
          event: undefined;
          req: NextApiRequest;
          res: NextApiResponse;
        }>(opts);
        return {};
      })
      .onUploadComplete(uploadCompleteMock),
  };

  function mockReq(opts: {
    query: Record<string, any>;
    method: string;
    body?: unknown;
    headers?: Record<string, string>;
  }) {
    const req = {
      url: "/?" + new URLSearchParams(opts.query).toString(),
      method: opts.method,
      query: opts.query,
      headers: {
        "x-forwarded-host": "localhost:3000",
        "x-forwarded-proto": "http",
        ...opts.headers,
      },
      body: opts.body,
    } as unknown as NextApiRequest;

    return { req };
  }
  function mockRes() {
    const json = vi.fn(() => res);
    const setHeader = vi.fn(() => res);
    const status = vi.fn(() => res);

    const res = {
      json,
      setHeader,
      status,
    } as unknown as NextApiResponse;

    return { res, json, setHeader, status };
  }

  it("gets NextApiRequest and NextApiResponse in middleware args", async ({
    db,
  }) => {
    const handler = createRouteHandler({
      router,
      config: {
        uploadthingSecret: "sk_live_test",
      },
    });

    const { req } = mockReq({
      query: { slug: "middleware", actionType: "upload" },
      body: {
        files: [{ name: "foo.txt", size: 48, type: "text/plain" }],
      },
      method: "POST",
      headers: baseHeaders,
    });
    const { res, status } = mockRes();

    await handler(req, res);
    expect(status).toHaveBeenCalledWith(200);

    expect(middlewareMock).toHaveBeenCalledOnce();
    expect(middlewareMock).toHaveBeenCalledWith(
      expect.objectContaining({ event: undefined, req, res }),
    );

    // Should proceed to have requested URLs
    expect(utApiMock).toHaveBeenCalledOnce();
    expect(utApiMock).toHaveBeenCalledWith(
      "https://uploadthing.com/api/prepareUpload",
      {
        body: '{"files":[{"name":"foo.txt","size":48}],"routeConfig":{"blob":{"maxFileSize":"8MB","maxFileCount":1,"contentDisposition":"inline"}},"metadata":{},"callbackUrl":"http://localhost:3000/","callbackSlug":"middleware"}',
        headers: {
          "content-type": "application/json",
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

describe("adapters:express", async () => {
  const { createUploadthing, createRouteHandler } = await import(
    "../src/express"
  );
  const f = createUploadthing();

  const router = {
    middleware: f({ blob: {} })
      .middleware((opts) => {
        middlewareMock(opts);
        expectTypeOf<{
          event: undefined;
          req: express.Request;
          res: express.Response;
        }>(opts);
        return {};
      })
      .onUploadComplete(uploadCompleteMock),
  };

  const startServer = (preregisters?: (app: express.Express) => void) => {
    const app = express.default();
    preregisters?.(app);
    app.use(
      "/api/uploadthing",
      createRouteHandler({
        router,
        config: {
          uploadthingSecret: "sk_live_test",
        },
      }),
    );

    const server = app.listen();
    const url = `http://localhost:${(server.address() as { port: number }).port}`;

    return { url, close: () => server.close() };
  };

  it("gets express.Request and express.Response in middleware args", async ({
    db,
  }) => {
    const server = startServer();

    const url = `${server.url}/api/uploadthing/`;
    const res = await fetch(`${url}?slug=middleware&actionType=upload`, {
      method: "POST",
      headers: { "content-type": "application/json", ...baseHeaders },
      body: JSON.stringify({
        files: [{ name: "foo.txt", size: 48, type: "text/plain" }],
      }),
    });
    expect(res.status).toBe(200);

    expect(middlewareMock).toHaveBeenCalledOnce();
    expect(middlewareMock).toHaveBeenCalledWith(
      expect.objectContaining({
        event: undefined,
        req: expect.objectContaining({
          baseUrl: "/api/uploadthing",
          url: "/?slug=middleware&actionType=upload",
        }),
        res: expect.objectContaining({}),
      }),
    );

    // Should proceed to have requested URLs
    expect(utApiMock).toHaveBeenCalledOnce();
    expect(utApiMock).toHaveBeenCalledWith(
      "https://uploadthing.com/api/prepareUpload",
      {
        body: `{"files":[{"name":"foo.txt","size":48}],"routeConfig":{"blob":{"maxFileSize":"8MB","maxFileCount":1,"contentDisposition":"inline"}},"metadata":{},"callbackUrl":"${url}","callbackSlug":"middleware"}`,
        headers: {
          "content-type": "application/json",
          "x-uploadthing-api-key": "sk_live_test",
          "x-uploadthing-be-adapter": "express",
          "x-uploadthing-fe-package": "vitest",
          "x-uploadthing-version": expect.stringMatching(/\d+\.\d+\.\d+/),
        },
        method: "POST",
      },
    );

    server.close();
  });

  it("works with some standard built-in middlewares", async ({ db }) => {
    const server = startServer((app) => {
      app.use(express.json());
      app.use(express.urlencoded({ extended: true }));
    });
    const url = `${server.url}/api/uploadthing/`;

    const res = await fetch(`${url}?slug=middleware&actionType=upload`, {
      method: "POST",
      headers: { "content-type": "application/json", ...baseHeaders },
      body: JSON.stringify({
        files: [{ name: "foo.txt", size: 48, type: "text/plain" }],
      }),
    });
    expect(res.status).toBe(200);
    expect(middlewareMock).toHaveBeenCalledOnce();

    server.close();
  });

  it("works with body-parser middleware", async ({ db }) => {
    const bodyParser = await import("body-parser");
    const server = startServer((app) => {
      app.use(bodyParser.json());
      app.use(bodyParser.urlencoded({ extended: true }));
    });

    const url = `${server.url}/api/uploadthing/`;
    const res = await fetch(`${url}?slug=middleware&actionType=upload`, {
      method: "POST",
      headers: { "content-type": "application/json", ...baseHeaders },
      body: JSON.stringify({
        files: [{ name: "foo.txt", size: 48, type: "text/plain" }],
      }),
    });
    expect(res.status).toBe(200);
    expect(middlewareMock).toHaveBeenCalledOnce();

    server.close();
  });
});

describe("adapters:fastify", async () => {
  const { createUploadthing, createRouteHandler } = await import(
    "../src/fastify"
  );
  const f = createUploadthing();

  const router = {
    middleware: f({ blob: {} })
      .middleware((opts) => {
        middlewareMock(opts);
        expectTypeOf<{
          event: undefined;
          req: fastify.FastifyRequest;
          res: fastify.FastifyReply;
        }>(opts);
        return {};
      })
      .onUploadComplete(uploadCompleteMock),
  };

  const startServer = async () => {
    const app = fastify.default();
    await app.register(createRouteHandler, {
      router,
      config: {
        uploadthingSecret: "sk_live_test",
      },
    });

    const addr = await app.listen();
    const port = addr.split(":").pop();
    const url = `http://localhost:${port}/`;

    return { url, close: () => app.close() };
  };

  it("gets fastify.FastifyRequest and fastify.FastifyReply in middleware args", async ({
    db,
  }) => {
    const server = await startServer();

    const url = `${server.url}api/uploadthing`;
    const res = await fetch(`${url}?slug=middleware&actionType=upload`, {
      method: "POST",
      headers: { "content-type": "application/json", ...baseHeaders },
      body: JSON.stringify({
        files: [{ name: "foo.txt", size: 48, type: "text/plain" }],
      }),
    });
    expect(res.status).toBe(200);

    expect(middlewareMock).toHaveBeenCalledOnce();
    expect(middlewareMock).toHaveBeenCalledWith(
      expect.objectContaining({
        event: undefined,
        req: expect.objectContaining({
          id: "req-1",
          params: {},
        }),
        res: expect.objectContaining({}),
      }),
    );

    // Should proceed to have requested URLs
    expect(utApiMock).toHaveBeenCalledOnce();
    expect(utApiMock).toHaveBeenCalledWith(
      "https://uploadthing.com/api/prepareUpload",
      {
        body: `{"files":[{"name":"foo.txt","size":48}],"routeConfig":{"blob":{"maxFileSize":"8MB","maxFileCount":1,"contentDisposition":"inline"}},"metadata":{},"callbackUrl":"${url}","callbackSlug":"middleware"}`,
        headers: {
          "content-type": "application/json",
          "x-uploadthing-api-key": "sk_live_test",
          "x-uploadthing-be-adapter": "fastify",
          "x-uploadthing-fe-package": "vitest",
          "x-uploadthing-version": expect.stringMatching(/\d+\.\d+\.\d+/),
        },
        method: "POST",
      },
    );

    await server.close();
  });
});
