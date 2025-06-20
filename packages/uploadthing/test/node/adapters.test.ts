/* eslint-disable no-restricted-globals */
import type { NextApiRequest, NextApiResponse } from "next";
import { NextRequest } from "next/server";
import * as FetchHttpClient from "@effect/platform/FetchHttpClient";
import * as HttpServerRequest from "@effect/platform/HttpServerRequest";
import * as HttpServerResponse from "@effect/platform/HttpServerResponse";
import * as ConfigProvider from "effect/ConfigProvider";
import * as Effect from "effect/Effect";
import * as Layer from "effect/Layer";
import * as express from "express";
import * as fastify from "fastify";
import { createApp, H3Event, toWebHandler } from "h3";
import { setupServer } from "msw/node";
import {
  afterAll,
  beforeAll,
  describe,
  expect,
  expectTypeOf,
  it,
  vi,
} from "vitest";

import {
  baseHeaders,
  createApiUrl,
  handlers,
  INGEST_URL,
  middlewareMock,
  requestSpy,
  requestsToDomain,
  testToken,
  uploadCompleteMock,
} from "../__test-helpers";

const server = setupServer(...handlers);
beforeAll(() => server.listen({ onUnhandledRequest: "bypass" }));
afterAll(() => server.close());

describe("adapters:h3", async () => {
  const { createUploadthing, createRouteHandler } = await import(
    "../../src/h3"
  );
  const f = createUploadthing();

  const router = {
    middleware: f({ blob: {} })
      .middleware((opts) => {
        middlewareMock(opts);
        expectTypeOf<{
          event: H3Event;
        }>(opts);
        return {};
      })
      .onUploadComplete(uploadCompleteMock),
  };

  it("returns router config on GET requests", async () => {
    const eventHandler = createRouteHandler({
      router,
      config: { token: testToken.encoded },
    });

    const res = await toWebHandler(createApp().use(eventHandler))(
      new Request("http://localhost:3000"),
    );

    expect(res.status).toBe(200);
    expect(res.headers.get("content-type")).toBe("application/json");

    const json = await res.json();
    expect(json).toEqual([
      {
        slug: "middleware",
        config: expect.objectContaining({ blob: expect.objectContaining({}) }),
      },
    ]);
  });

  it("gets H3Event in middleware args", async () => {
    const eventHandler = createRouteHandler({
      router,
      config: { token: testToken.encoded },
    });

    // FIXME: Didn't know how to declaratively create a H3Event to
    // call the handler with directly, so I used the web-handler converter
    // and sent in a Request and let H3 create one for me 🤷‍♂️
    const res = await toWebHandler(createApp().use(eventHandler))(
      new Request(createApiUrl("middleware", "upload"), {
        method: "POST",
        headers: {
          ...baseHeaders,
          host: "localhost:3000",
          "x-forwarded-proto": "http",
        },
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
      }),
    );

    // Should proceed to generate a signed URL
    const json = await res.json();
    expect(json).toEqual([
      {
        customId: null,
        key: expect.stringMatching(/.+/),
        url: expect.stringMatching(
          `https://fra1.ingest.(uploadthing|ut-staging).com/.+`,
        ),
        name: "foo.txt",
      },
    ]);

    // Should (asynchronously) register metadata at UploadThing
    await vi.waitUntil(() => requestsToDomain(INGEST_URL).length);
    expect(requestSpy).toHaveBeenCalledWith(`${INGEST_URL}/route-metadata`, {
      body: {
        isDev: false,
        awaitServerData: true,
        fileKeys: [json[0].key],
        metadata: {},
        callbackUrl: "http://localhost:3000/",
        callbackSlug: "middleware",
      },
      headers: expect.objectContaining({
        "content-type": "application/json",
        "x-uploadthing-api-key": "sk_foo",
        "x-uploadthing-be-adapter": "h3",
        "x-uploadthing-fe-package": "vitest",
        "x-uploadthing-version": expect.stringMatching(/\d+\.\d+\.\d+/),
      }),
      method: "POST",
    });
  });
});

describe("adapters:server", async () => {
  const { createUploadthing, createRouteHandler } = await import(
    "../../src/server"
  );
  const f = createUploadthing();

  const router = {
    middleware: f({ blob: {} })
      .middleware((opts) => {
        middlewareMock(opts);
        expectTypeOf<{
          req: Request;
        }>(opts);
        return {};
      })
      .onUploadComplete(uploadCompleteMock),
  };

  it("returns router config on GET requests", async () => {
    const eventHandler = createRouteHandler({
      router,
      config: { token: testToken.encoded },
    });

    const res = await eventHandler(new Request("http://localhost:3000"));

    expect(res.status).toBe(200);
    expect(res.headers.get("content-type")).toBe("application/json");

    const json = await res.json();
    expect(json).toEqual([
      {
        slug: "middleware",
        config: expect.objectContaining({ blob: expect.objectContaining({}) }),
      },
    ]);
  });

  it("gets Request in middleware args", async () => {
    const handler = createRouteHandler({
      router,
      config: { token: testToken.encoded },
    });

    const req = new Request(createApiUrl("middleware", "upload"), {
      method: "POST",
      headers: {
        ...baseHeaders,
        host: "localhost:3000",
        "x-forwarded-proto": "http",
      },
      body: JSON.stringify({
        files: [{ name: "foo.txt", size: 48, type: "text/plain" }],
      }),
    });
    const res = await handler(req);
    expect(res.status).toBe(200);

    expect(middlewareMock).toHaveBeenCalledOnce();
    expect(middlewareMock).toHaveBeenCalledWith(
      expect.objectContaining({ req }),
    );

    // Should proceed to generate a signed URL
    const json = await res.json();
    expect(json).toEqual([
      {
        customId: null,
        key: expect.stringMatching(/.+/),
        url: expect.stringMatching(`${INGEST_URL}/.+`),
        name: "foo.txt",
      },
    ]);

    // Should (asynchronously) register metadata at UploadThing
    await vi.waitUntil(() => requestsToDomain(INGEST_URL).length);
    expect(requestSpy).toHaveBeenCalledWith(`${INGEST_URL}/route-metadata`, {
      body: {
        isDev: false,
        awaitServerData: true,
        fileKeys: [json[0].key],
        metadata: {},
        callbackUrl: "http://localhost:3000/",
        callbackSlug: "middleware",
      },
      headers: expect.objectContaining({
        "content-type": "application/json",
        "x-uploadthing-api-key": "sk_foo",
        "x-uploadthing-be-adapter": "server",
        "x-uploadthing-fe-package": "vitest",
        "x-uploadthing-version": expect.stringMatching(/\d+\.\d+\.\d+/),
      }),
      method: "POST",
    });
  });

  it("accepts object with request in", async () => {
    const handler = createRouteHandler({
      router,
      config: { token: testToken.encoded },
    });

    const req = new Request(createApiUrl("middleware", "upload"), {
      method: "POST",
      headers: {
        ...baseHeaders,
        host: "localhost:3000",
        "x-forwarded-proto": "http",
      },
      body: JSON.stringify({
        files: [{ name: "foo.txt", size: 48, type: "text/plain" }],
      }),
    });
    const res = await handler({ request: req });
    expect(res.status).toBe(200);

    expect(middlewareMock).toHaveBeenCalledOnce();
    expect(middlewareMock).toHaveBeenCalledWith(
      expect.objectContaining({ req }),
    );

    // Should proceed to generate a signed URL
    const json = await res.json();
    expect(json).toEqual([
      {
        customId: null,
        key: expect.stringMatching(/.+/),
        url: expect.stringMatching(`${INGEST_URL}/.+`),
        name: "foo.txt",
      },
    ]);

    // Should (asynchronously) register metadata at UploadThing
    await vi.waitUntil(() => requestsToDomain(INGEST_URL).length);
    expect(requestSpy).toHaveBeenCalledWith(`${INGEST_URL}/route-metadata`, {
      body: {
        isDev: false,
        awaitServerData: true,
        fileKeys: [json[0].key],
        metadata: {},
        callbackUrl: "http://localhost:3000/",
        callbackSlug: "middleware",
      },
      headers: expect.objectContaining({
        "content-type": "application/json",
        "x-uploadthing-api-key": "sk_foo",
        "x-uploadthing-be-adapter": "server",
        "x-uploadthing-fe-package": "vitest",
        "x-uploadthing-version": expect.stringMatching(/\d+\.\d+\.\d+/),
      }),
      method: "POST",
    });
  });
});

describe("adapters:next", async () => {
  const { createUploadthing, createRouteHandler } = await import(
    "../../src/next"
  );
  const f = createUploadthing();

  const router = {
    middleware: f({ blob: {} })
      .middleware((opts) => {
        middlewareMock(opts);
        expectTypeOf<{
          req: NextRequest;
        }>(opts);
        return {};
      })
      .onUploadComplete(uploadCompleteMock),
  };

  it("returns router config on GET requests", async () => {
    const eventHandler = createRouteHandler({
      router,
      config: { token: testToken.encoded },
    });

    const res = await eventHandler.GET(
      new NextRequest("http://localhost:3000"),
    );

    expect(res.status).toBe(200);
    expect(res.headers.get("content-type")).toBe("application/json");

    const json = await res.json();
    expect(json).toEqual([
      {
        slug: "middleware",
        config: expect.objectContaining({ blob: expect.objectContaining({}) }),
      },
    ]);
  });

  it("gets NextRequest in middleware args", async () => {
    const handlers = createRouteHandler({
      router,
      config: { token: testToken.encoded },
    });

    const req = new NextRequest(createApiUrl("middleware", "upload"), {
      method: "POST",
      headers: {
        ...baseHeaders,
        host: "localhost:3000",
        "x-forwarded-proto": "http",
      },
      body: JSON.stringify({
        files: [{ name: "foo.txt", size: 48, type: "text/plain" }],
      }),
    });
    const res = await handlers.POST(req);
    expect(res.status).toBe(200);

    expect(middlewareMock).toHaveBeenCalledOnce();
    expect(middlewareMock).toHaveBeenCalledWith(
      expect.objectContaining({ req }),
    );

    // Should proceed to generate a signed URL
    const json = await res.json();
    expect(json).toEqual([
      {
        customId: null,
        key: expect.stringMatching(/.+/),
        url: expect.stringMatching(`${INGEST_URL}/.+`),
        name: "foo.txt",
      },
    ]);

    // Should (asynchronously) register metadata at UploadThing
    await vi.waitUntil(() => requestsToDomain(INGEST_URL).length);
    expect(requestSpy).toHaveBeenCalledWith(`${INGEST_URL}/route-metadata`, {
      body: {
        isDev: false,
        awaitServerData: true,
        fileKeys: [json[0].key],
        metadata: {},
        callbackUrl: "http://localhost:3000/",
        callbackSlug: "middleware",
      },
      headers: expect.objectContaining({
        "content-type": "application/json",
        "x-uploadthing-api-key": "sk_foo",
        "x-uploadthing-be-adapter": "nextjs-app",
        "x-uploadthing-fe-package": "vitest",
        "x-uploadthing-version": expect.stringMatching(/\d+\.\d+\.\d+/),
      }),
      method: "POST",
    });
  });
});

describe("adapters:next-legacy", async () => {
  const { createUploadthing, createRouteHandler } = await import(
    "../../src/next-legacy"
  );
  const f = createUploadthing();

  const router = {
    middleware: f({ blob: {} })
      .middleware((opts) => {
        middlewareMock(opts);
        expectTypeOf<{
          req: NextApiRequest;
          res: NextApiResponse;
        }>(opts);
        return {};
      })
      .onUploadComplete(uploadCompleteMock),
  };

  function mockReq(opts: {
    query?: Record<string, any>;
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

  it("returns router config on GET requests", async () => {
    const eventHandler = createRouteHandler({
      router,
      config: { token: testToken.encoded },
    });

    const { req } = mockReq({
      method: "GET",
    });
    const { res, json } = mockRes();

    await eventHandler(req, res);

    expect(res.status).toHaveBeenCalledWith(200);

    const resJson = (json.mock.calls[0] as any[])[0];
    expect(resJson).toEqual([
      {
        slug: "middleware",
        config: expect.objectContaining({ blob: expect.objectContaining({}) }),
      },
    ]);
  });

  it("gets NextApiRequest and NextApiResponse in middleware args", async () => {
    const handler = createRouteHandler({
      router,
      config: { token: testToken.encoded },
    });

    const { req } = mockReq({
      query: { slug: "middleware", actionType: "upload" },
      body: {
        files: [{ name: "foo.txt", size: 48, type: "text/plain" }],
      },
      method: "POST",
      headers: {
        ...baseHeaders,
        host: "localhost:3000",
        "x-forwarded-proto": "http",
      },
    });
    const { res, status, json } = mockRes();

    await handler(req, res);
    expect(status).toHaveBeenCalledWith(200);

    expect(middlewareMock).toHaveBeenCalledOnce();
    expect(middlewareMock).toHaveBeenCalledWith(
      expect.objectContaining({ req, res }),
    );

    // Should proceed to generate a signed URL
    const resJson = (json.mock.calls[0] as any[])[0];
    expect(resJson).toEqual([
      {
        customId: null,
        key: expect.stringMatching(/.+/),
        url: expect.stringMatching(`${INGEST_URL}/.+`),
        name: "foo.txt",
      },
    ]);

    // Should (asynchronously) register metadata at UploadThing
    await vi.waitUntil(() => requestsToDomain(INGEST_URL).length);
    expect(requestSpy).toHaveBeenCalledWith(`${INGEST_URL}/route-metadata`, {
      body: {
        isDev: false,
        awaitServerData: true,
        fileKeys: [resJson[0]?.key],
        metadata: {},
        callbackUrl: "http://localhost:3000/",
        callbackSlug: "middleware",
      },
      headers: expect.objectContaining({
        "content-type": "application/json",
        "x-uploadthing-api-key": "sk_foo",
        "x-uploadthing-be-adapter": "nextjs-pages",
        "x-uploadthing-fe-package": "vitest",
        "x-uploadthing-version": expect.stringMatching(/\d+\.\d+\.\d+/),
      }),
      method: "POST",
    });
  });
});

describe("adapters:express", async () => {
  const { createUploadthing, createRouteHandler } = await import(
    "../../src/express"
  );
  const f = createUploadthing();

  const router = {
    middleware: f({ blob: {} })
      .middleware((opts) => {
        middlewareMock(opts);
        expectTypeOf<{
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
        config: { token: testToken.encoded },
      }),
    );

    const server = app.listen();
    const url = `http://localhost:${(server.address() as { port: number }).port}`;

    return { url, [Symbol.dispose]: () => server.close() };
  };

  it("returns router config on GET requests", async () => {
    using server = startServer();

    const url = `${server.url}/api/uploadthing/`;
    const res = await fetch(url);

    expect(res.status).toBe(200);
    expect(res.headers.get("content-type")).toBe("application/json");

    const json = await res.json();
    expect(json).toEqual([
      {
        slug: "middleware",
        config: expect.objectContaining({ blob: expect.objectContaining({}) }),
      },
    ]);
  });

  it("gets express.Request and express.Response in middleware args", async () => {
    using server = startServer();

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
        req: expect.objectContaining({
          baseUrl: "/api/uploadthing",
          url: "/?slug=middleware&actionType=upload",
        }),
        res: expect.objectContaining({}),
      }),
    );

    // Should proceed to generate a signed URL
    const json = await res.json();
    expect(json).toEqual([
      {
        customId: null,
        key: expect.stringMatching(/.+/),
        url: expect.stringMatching(`${INGEST_URL}/.+`),
        name: "foo.txt",
      },
    ]);

    // Should (asynchronously) register metadata at UploadThing
    await vi.waitUntil(() => requestsToDomain(INGEST_URL).length);
    expect(requestSpy).toHaveBeenCalledWith(`${INGEST_URL}/route-metadata`, {
      body: {
        isDev: false,
        awaitServerData: true,
        fileKeys: [json[0].key],
        metadata: {},
        callbackUrl: url,
        callbackSlug: "middleware",
      },
      headers: expect.objectContaining({
        "content-type": "application/json",
        "x-uploadthing-api-key": "sk_foo",
        "x-uploadthing-be-adapter": "express",
        "x-uploadthing-fe-package": "vitest",
        "x-uploadthing-version": expect.stringMatching(/\d+\.\d+\.\d+/),
      }),
      method: "POST",
    });
  });

  it("works with some standard built-in middlewares", async () => {
    using server = startServer((app) => {
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
  });

  it("works with body-parser middleware", async () => {
    const bodyParser = await import("body-parser");
    using server = startServer((app) => {
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
  });
});

describe("adapters:fastify", async () => {
  const { createUploadthing, createRouteHandler } = await import(
    "../../src/fastify"
  );
  const f = createUploadthing();

  const router = {
    middleware: f({ blob: {} })
      .middleware((opts) => {
        middlewareMock(opts);
        expectTypeOf<{
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
      config: { token: testToken.encoded },
    });

    const addr = await app.listen();
    const port = addr.split(":").pop();
    const url = `http://localhost:${port}/`;

    return { url, [Symbol.asyncDispose]: () => app.close() };
  };

  it("returns router config on GET requests", async () => {
    await using server = await startServer();

    const url = `${server.url}api/uploadthing`;
    const res = await fetch(url);

    expect(res.status).toBe(200);
    expect(res.headers.get("content-type")).toBe("application/json");

    const json = await res.json();
    expect(json).toEqual([
      {
        slug: "middleware",
        config: expect.objectContaining({ blob: expect.objectContaining({}) }),
      },
    ]);
  });

  it("gets fastify.FastifyRequest and fastify.FastifyReply in middleware args", async () => {
    await using server = await startServer();

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
        req: expect.objectContaining({
          id: "req-1",
          params: {},
        }),
        res: expect.objectContaining({}),
      }),
    );

    // Should proceed to generate a signed URL
    const json = await res.json();
    expect(json).toEqual([
      {
        customId: null,
        key: expect.stringMatching(/.+/),
        url: expect.stringMatching(`${INGEST_URL}/.+`),
        name: "foo.txt",
      },
    ]);

    // Should (asynchronously) register metadata at UploadThing
    await vi.waitUntil(() => requestsToDomain(INGEST_URL).length);
    expect(requestSpy).toHaveBeenCalledWith(`${INGEST_URL}/route-metadata`, {
      body: {
        isDev: false,
        awaitServerData: true,
        fileKeys: [json[0].key],
        metadata: {},
        callbackUrl: url,
        callbackSlug: "middleware",
      },
      headers: expect.objectContaining({
        "content-type": "application/json",
        "x-uploadthing-api-key": "sk_foo",
        "x-uploadthing-be-adapter": "fastify",
        "x-uploadthing-fe-package": "vitest",
        "x-uploadthing-version": expect.stringMatching(/\d+\.\d+\.\d+/),
      }),
      method: "POST",
    });
  });
});

describe("adapters:effect-platform", async () => {
  const { it } = await import("@effect/vitest");

  const { createUploadthing, createRouteHandler } = await import(
    "../../src/effect-platform"
  );
  const f = createUploadthing();

  const router = {
    middleware: f({ blob: {} })
      .middleware((opts) => {
        middlewareMock(opts);
        expectTypeOf<{
          req: HttpServerRequest.HttpServerRequest;
        }>(opts);
        return {};
      })
      .onUploadComplete(uploadCompleteMock),
  };

  it.effect("returns router config on GET requests", () =>
    Effect.gen(function* () {
      const eventHandler = createRouteHandler({
        router,
        config: { token: testToken.encoded },
      }).pipe(Effect.provide(FetchHttpClient.layer));

      const serverRequest = HttpServerRequest.fromWeb(
        new Request("http://localhost:3000"),
      );
      const response = yield* eventHandler.pipe(
        Effect.provideService(
          HttpServerRequest.HttpServerRequest,
          serverRequest,
        ),
      );
      expect(response.status).toBe(200);
      expect(response.headers["content-type"]).toBe("application/json");

      const json = yield* Effect.promise(() =>
        HttpServerResponse.toWeb(response).json(),
      );

      expect(json).toEqual([
        {
          slug: "middleware",
          config: expect.objectContaining({
            blob: expect.objectContaining({}),
          }),
        },
      ]);
    }),
  );

  it.effect("gets HttpServerRequest in middleware args", () =>
    Effect.gen(function* () {
      const handler = createRouteHandler({
        router,
        config: { token: testToken.encoded },
      }).pipe(Effect.provide(FetchHttpClient.layer));

      const req = new Request(createApiUrl("middleware", "upload"), {
        method: "POST",
        headers: baseHeaders,
        body: JSON.stringify({
          files: [{ name: "foo.txt", size: 48, type: "text/plain" }],
        }),
      });

      const serverRequest = HttpServerRequest.fromWeb(req);
      const response = yield* handler.pipe(
        Effect.provideService(
          HttpServerRequest.HttpServerRequest,
          serverRequest,
        ),
      );

      const json = yield* Effect.promise(() =>
        HttpServerResponse.toWeb(response).json(),
      );

      expect(json).toEqual([
        {
          customId: null,
          key: expect.stringMatching(/.+/),
          url: expect.stringMatching(`${INGEST_URL}/.+`),
          name: "foo.txt",
        },
      ]);
      expect(response.status).toBe(200);

      expect(middlewareMock).toHaveBeenCalledOnce();
      expect(middlewareMock).toHaveBeenCalledWith(
        expect.objectContaining({
          req: serverRequest,
        }),
      );
    }),
  );

  /**
   * I'm not entirely sure how this is supposed to work, but Datner
   * gave some thoughts on how Effect users having their own ConfigProvider
   * might conflict with the one provided by UploadThing.
   */
  it.effect.skip("still finds the token with a custom config provider", () =>
    Effect.gen(function* () {
      const handler = createRouteHandler({
        router,
      }).pipe(Effect.provide(FetchHttpClient.layer));

      const req = new Request(createApiUrl("middleware", "upload"), {
        method: "POST",
        headers: baseHeaders,
        body: JSON.stringify({
          files: [{ name: "foo.txt", size: 48, type: "text/plain" }],
        }),
      });

      const serverRequest = HttpServerRequest.fromWeb(req);
      const response = yield* handler.pipe(
        Effect.provideService(
          HttpServerRequest.HttpServerRequest,
          serverRequest,
        ),
      );

      expect(response.status).toBe(200);
    }).pipe(
      Effect.provide(
        Layer.setConfigProvider(
          ConfigProvider.fromJson({
            uploadthingToken: testToken.encoded,
          }),
        ),
      ),
    ),
  );
});
