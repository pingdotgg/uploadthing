/* eslint-disable no-restricted-globals */
import type { NextApiRequest, NextApiResponse } from "next";
import { after, NextRequest } from "next/server";
import type * as NextServer from "next/server";
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
  afterEach,
  beforeAll,
  beforeEach,
  describe,
  expect,
  expectTypeOf,
  it,
  onTestFinished,
  vi,
} from "vitest";

import { signPayload } from "@uploadthing/shared";

import {
  baseHeaders,
  createApiUrl,
  handlers,
  INGEST_URL,
  middlewareMock,
  requestSpy,
  requestsToDomain,
  testToken,
  UFS_HOST,
  uploadCompleteMock,
  UTFS_URL,
} from "../__test-helpers";
import { UploadedFileData } from "../../src/_internal/shared-schemas";
import type { RequestContext } from "../../src/next";

vi.mock("next/server", async () => {
  const actual = (await vi.importActual("next/server")) as typeof NextServer;
  return {
    ...actual,
    after: vi.fn(),
  };
});

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
  const nextAdapter = await import("../../src/next");
  const { createUploadthing, createRouteHandler } = nextAdapter;
  const f = createUploadthing();

  beforeEach(() => {
    vi.mocked(after).mockReset();
  });

  const router = {
    middleware: f({ blob: {} })
      .middleware((opts) => {
        middlewareMock(opts);
        expectTypeOf<{
          req: NextRequest;
          ctx: {
            waitUntil: (task: Promise<unknown> | (() => unknown)) => void;
          };
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
    expect(after).not.toHaveBeenCalled();

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
      expect.objectContaining({
        req,
        ctx: { waitUntil: expect.any(Function) },
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

  describe("ctx.waitUntil", () => {
    const outsideRequestScope = "after was called outside a request scope";
    const taskFailed = "[uploadthing] ctx.waitUntil task failed.";

    const uploadedPayload = JSON.stringify({
      status: "uploaded",
      metadata: {},
      origin: "https://example.com",
      file: new UploadedFileData({
        url: `${UTFS_URL}/f/some-random-key.png`,
        appUrl: `${UTFS_URL}/a/${testToken.decoded.appId}/f/some-random-key.png`,
        ufsUrl: `https://${testToken.decoded.appId}.${UFS_HOST}/f/some-random-key.png`,
        name: "foo.png",
        key: "some-random-key.png",
        size: 48,
        type: "image/png",
        customId: null,
        fileHash: "some-md5-hash",
      }),
    });
    const failedPayload = JSON.stringify({
      fileKey: "some-random-key.png",
      error: "network",
    });

    const uploadRequest = () =>
      new NextRequest(createApiUrl("background", "upload"), {
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

    const hookRequest = async (hook: "callback" | "error", payload: string) =>
      new NextRequest(createApiUrl("background"), {
        method: "POST",
        headers: {
          "uploadthing-hook": hook,
          "x-uploadthing-signature": await Effect.runPromise(
            signPayload(payload, testToken.decoded.apiKey),
          ),
        },
        body: payload,
      });

    /** Every hook on the route schedules the same work. */
    const handlersFor = (
      schedule: (waitUntil: RequestContext["waitUntil"]) => void,
      { adapter = nextAdapter, isDev = false } = {},
    ) => {
      const route = adapter.createUploadthing();
      return adapter.createRouteHandler({
        router: {
          background: route({ blob: {} })
            .middleware(({ ctx }) => {
              schedule(ctx.waitUntil);
              return {};
            })
            .onUploadError(({ ctx }) => schedule(ctx.waitUntil))
            .onUploadComplete(({ ctx }) => schedule(ctx.waitUntil)),
        },
        config: { token: testToken.encoded, isDev },
      });
    };

    /** Stands in for Next.js running `after` callbacks once the response ends. */
    const endResponse = () =>
      Promise.all(
        vi
          .mocked(after)
          .mock.calls.map(([task]) =>
            typeof task === "function" ? task() : task,
          ),
      );

    /**
     * The one-time warning is module state, so tests that assert on it load a
     * fresh adapter. The `next/server` mock stays shared across the reset.
     */
    const loadFreshAdapter = () => {
      vi.resetModules();
      return import("../../src/next");
    };

    afterEach(() => {
      vi.restoreAllMocks();
    });

    it("registers with after before POST first awaits", async () => {
      const task = vi.fn();
      const handlers = handlersFor((waitUntil) => waitUntil(task));
      let inPostCall = false;
      vi.mocked(after).mockImplementation(() => {
        if (!inPostCall) throw new Error(outsideRequestScope);
      });

      inPostCall = true;
      const pending = handlers.POST(uploadRequest());
      inPostCall = false;

      expect((await pending).status).toBe(200);
      expect(task).not.toHaveBeenCalled();
      await endResponse();
      expect(task).toHaveBeenCalledOnce();
    });

    it.each([
      { hook: "callback", payload: uploadedPayload },
      { hook: "error", payload: failedPayload },
    ] as const)(
      "runs $hook hook tasks once the response ends",
      async ({ hook, payload }) => {
        const task = vi.fn();
        const handlers = handlersFor((waitUntil) => waitUntil(task));

        const res = await handlers.POST(await hookRequest(hook, payload));

        expect(res.status).toBe(200);
        expect(task).not.toHaveBeenCalled();
        await endResponse();
        expect(task).toHaveBeenCalledOnce();
      },
    );

    it("contains failures, including promises that reject before the response ends", async () => {
      const errorLog = vi
        .spyOn(console, "error")
        .mockImplementation(() => undefined);
      const unhandled: Array<unknown> = [];
      const collect = (reason: unknown) => void unhandled.push(reason);
      process.on("unhandledRejection", collect);
      onTestFinished(() => void process.off("unhandledRejection", collect));
      const handlers = handlersFor((waitUntil) => {
        waitUntil(Promise.reject(new Error("delete failed")));
        waitUntil(() => {
          throw new Error("boom");
        });
      });

      const res = await handlers.POST(uploadRequest());
      await new Promise((resolve) => setTimeout(resolve, 0));
      await endResponse();

      expect(res.status).toBe(200);
      expect(unhandled).toEqual([]);
      expect(errorLog).toHaveBeenCalledWith(
        taskFailed,
        expect.objectContaining({ message: "delete failed" }),
      );
      expect(errorLog).toHaveBeenCalledWith(
        taskFailed,
        expect.objectContaining({ message: "boom" }),
      );
    });

    it("keeps the flush open for tasks queued while it runs", async () => {
      const finished = vi.fn();
      const handlers = handlersFor((waitUntil) =>
        waitUntil(() =>
          waitUntil(() =>
            new Promise((resolve) => setTimeout(resolve, 0)).then(finished),
          ),
        ),
      );

      const res = await handlers.POST(uploadRequest());
      await endResponse();

      expect(res.status).toBe(200);
      expect(finished).toHaveBeenCalledOnce();
    });

    it("runs a development hook that outlives the response once, without warning", async () => {
      const adapter = await loadFreshAdapter();
      vi.mocked(after).mockImplementation((flush) => {
        if (typeof flush === "function") void flush();
      });
      const warnLog = vi
        .spyOn(console, "warn")
        .mockImplementation(() => undefined);
      const task = vi.fn();
      const handlers = handlersFor((waitUntil) => waitUntil(task), {
        adapter,
        isDev: true,
      });

      const res = await handlers.POST(
        await hookRequest("callback", uploadedPayload),
      );
      await vi.waitUntil(() => task.mock.calls.length > 0);
      await endResponse();

      expect(res.status).toBe(200);
      expect(task).toHaveBeenCalledOnce();
      expect(warnLog).not.toHaveBeenCalled();
    });

    it("warns once and runs each task in-process when after is missing", async () => {
      const adapter = await loadFreshAdapter();
      const nextServer = await import("next/server");
      const mockedAfter = nextServer.after;
      Object.defineProperty(nextServer, "after", {
        configurable: true,
        value: undefined,
      });
      onTestFinished(() => {
        Object.defineProperty(nextServer, "after", {
          configurable: true,
          value: mockedAfter,
        });
      });
      const warnLog = vi
        .spyOn(console, "warn")
        .mockImplementation(() => undefined);
      const task = vi.fn();
      const handlers = handlersFor((waitUntil) => waitUntil(task), {
        adapter,
      });

      const responses = [
        await handlers.POST(uploadRequest()),
        await handlers.POST(uploadRequest()),
      ];

      expect(responses.map((res) => res.status)).toEqual([200, 200]);
      expect(task).toHaveBeenCalledTimes(2);
      expect(warnLog).toHaveBeenCalledOnce();
    });

    it("runs the task once when after throws, even if it kept the callback", async () => {
      const adapter = await loadFreshAdapter();
      vi.mocked(after).mockImplementation(() => {
        throw new Error(outsideRequestScope);
      });
      const warnLog = vi
        .spyOn(console, "warn")
        .mockImplementation(() => undefined);
      const task = vi.fn();
      const handlers = handlersFor((waitUntil) => waitUntil(task), {
        adapter,
      });

      const res = await handlers.POST(uploadRequest());
      await endResponse();

      expect(res.status).toBe(200);
      expect(task).toHaveBeenCalledOnce();
      expect(warnLog).toHaveBeenCalledOnce();
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
