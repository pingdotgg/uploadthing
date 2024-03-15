import express from "express";
import { http, HttpResponse } from "msw";
import { setupServer } from "msw/node";
import { beforeEach, it as itBase, vi } from "vitest";

import { lookup } from "@uploadthing/mime-types";
import { generateUploadThingURL } from "@uploadthing/shared";

import { genUploader } from "../src/client";
import { createRouteHandler, createUploadthing } from "../src/express";
import { UPLOADTHING_VERSION } from "../src/internal/constants";
import type {
  ActionType,
  FileRouter,
  MPUResponse,
  PresignedBase,
  PSPResponse,
} from "../src/internal/types";

export interface MockDbInterface {
  files: any[];
  insertFile: (file: any) => void;
  getFileByKey: (key: string) => any;
}

export const it = itBase.extend<{ db: MockDbInterface }>({
  // eslint-disable-next-line no-empty-pattern
  db: async ({}, use) => {
    const files: any[] = [];
    const db: MockDbInterface = {
      files,
      insertFile: (file) => files.push(file),
      getFileByKey: (key) => files.find((f) => f.key === key),
    };
    await use(db);
    files.length = 0;
  },
});

export const s3Mock = vi.fn();
export const staticAssetMock = vi.fn();
export const utApiMock = vi.fn();
export const middlewareMock = vi.fn();
export const uploadCompleteMock = vi.fn();
export const onErrorMock = vi.fn();
beforeEach(() => {
  s3Mock.mockClear();
  staticAssetMock.mockClear();
  utApiMock.mockClear();
  middlewareMock.mockClear();
  uploadCompleteMock.mockClear();
  onErrorMock.mockClear();
});

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

const mockPresigned = (file: {
  name: string;
  size: number;
  customId: string | null;
}): PSPResponse | MPUResponse => {
  const base: PresignedBase = {
    contentDisposition: "inline",
    customId: file.customId ?? null,
    fileName: file.name,
    fileType: lookup(file.name) as any,
    fileUrl: "https://utfs.io/f/abc-123.txt",
    key: "abc-123.txt",
    pollingJwt: "random-jwt",
    pollingUrl: generateUploadThingURL("/api/serverCallback"),
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
    fields: { key: "abc-123.txt" },
  };
};

const utapiMocks = (db: MockDbInterface) => [
  http.post(
    "https://uploadthing.com/api/prepareUpload",
    async ({ request }) => {
      const body = (await request.json()) as { files: any[] } & Record<
        string,
        string
      >;

      utApiMock(request.url, {
        method: request.method,
        headers: Object.fromEntries(request.headers.entries()),
        body: JSON.stringify(body),
      });

      const presigneds = body.files.map((file) => {
        const presigned = mockPresigned(file);
        db.insertFile({
          ...file,
          key: presigned.key,
          callbackUrl: body.callbackUrl,
          callbackSlug: body.callbackSlug,
        });
        return presigned;
      });
      return HttpResponse.json(presigneds);
    },
  ),
  http.post("https://uploadthing.com/api/uploadFiles", async ({ request }) => {
    const body = (await request.json()) as { files: any[] };

    utApiMock(request.url, {
      method: request.method,
      headers: Object.fromEntries(request.headers.entries()),
      body: JSON.stringify(body),
    });

    const presigneds = body?.files.map((file) => {
      const presigned = mockPresigned(file);
      db.insertFile({
        ...file,
        key: presigned.key,
      });
      return presigned;
    });
    return HttpResponse.json({ data: presigneds });
  }),
  http.post(
    "https://uploadthing.com/api/completeMultipart",
    async ({ request }) => {
      const body = await request.json();

      utApiMock(request.url, {
        method: request.method,
        headers: Object.fromEntries(request.headers.entries()),
        body: JSON.stringify(body),
      });

      return HttpResponse.json({ success: true });
    },
  ),
  http.post(
    "https://uploadthing.com/api/failureCallback",
    async ({ request }) => {
      const body = await request.json();

      utApiMock(request.url, {
        method: request.method,
        headers: Object.fromEntries(request.headers.entries()),
        body: JSON.stringify(body),
      });

      return HttpResponse.json({ success: true });
    },
  ),
  http.get(
    "https://uploadthing.com/api/pollUpload/:key",
    async ({ request }) => {
      utApiMock(request.url, {
        method: request.method,
        headers: Object.fromEntries(request.headers.entries()),
      });

      const url = new URL(request.url);
      const key = url.pathname.slice("/api/pollUpload/".length);
      return HttpResponse.json({
        status: "done",
        fileData: db.getFileByKey(key),
      });
    },
  ),
  http.post(
    "https://uploadthing.com/api/requestFileAccess",
    async ({ request }) => {
      const body = await request.json();

      utApiMock(request.url, {
        method: request.method,
        headers: Object.fromEntries(request.headers.entries()),
        body: JSON.stringify(body),
      });

      return HttpResponse.json({
        url: "https://utfs.io/f/someFileKey?x-some-amz=query-param",
      });
    },
  ),
  http.post(
    "https://uploadthing.com/api/serverCallback",
    async ({ request }) => {
      const body = await request.json();

      utApiMock(request.url, {
        method: request.method,
        headers: Object.fromEntries(request.headers.entries()),
        body: JSON.stringify(body),
      });

      return HttpResponse.json({ success: true });
    },
  ),
  http.get("https://uploadthing.com/api/serverCallback", ({ request }) => {
    utApiMock(request.url, {
      method: request.method,
      headers: Object.fromEntries(request.headers.entries()),
    });

    return HttpResponse.json({ success: true });
  }),
];

const staticAssetServer = [
  http.get("https://cdn.foo.com/:fileKey", ({ request }) => {
    staticAssetMock(request.url);

    return HttpResponse.text("Lorem ipsum doler sit amet", {
      headers: { "content-type": "text/plain" },
    });
  }),
  http.get("https://utfs.io/f/:key", ({ request }) => {
    staticAssetMock(request.url);

    return HttpResponse.text("Lorem ipsum doler sit amet", {
      headers: { "content-type": "text/plain" },
    });
  }),
];

const s3Mocks = (fail: boolean) =>
  fail
    ? [
        http.post("https://bucket.s3.amazonaws.com", async ({ request }) => {
          s3Mock(request.url, {
            method: request.method,
            headers: Object.fromEntries(request.headers.entries()),
            body: await request.formData(),
          });
          return HttpResponse.json(null, { status: 403 });
        }),
        http.put(
          "https://bucket.s3.amazonaws.com/:key",
          async ({ request }) => {
            s3Mock(request.url, {
              method: request.method,
              headers: Object.fromEntries(request.headers.entries()),
              body: await request.formData(),
            });
            return HttpResponse.json(null, { status: 204 });
          },
        ),
      ]
    : [
        http.post("https://bucket.s3.amazonaws.com", async ({ request }) => {
          s3Mock(request.url, {
            method: request.method,
            headers: Object.fromEntries(request.headers.entries()),
            // body: fd,
          });
          return HttpResponse.json(null, { status: 204 });
        }),
        http.put(
          "https://bucket.s3.amazonaws.com/:key",
          async ({ request }) => {
            s3Mock(request.url, {
              method: request.method,
              headers: Object.fromEntries(request.headers.entries()),
              body: await request.formData(),
            });
            return HttpResponse.json(null, {
              status: 204,
              headers: { ETag: "abc123" },
            });
          },
        ),
      ];

export const setupMsw = (opts: {
  db: MockDbInterface;
  failS3Call?: boolean;
}) => {
  const server = setupServer(
    ...s3Mocks(opts.failS3Call ?? false),
    ...staticAssetServer,
    ...utapiMocks(opts.db),
  );
  server.listen({ onUnhandledRequest: "warn" });
  return server;
};

/**
 * Starts an Express server and sets up mocked handlers using MSW
 */
export const setupUTServer = <TExtraRoutes extends FileRouter>(opts: {
  db: MockDbInterface;
  extraRoutes?: TExtraRoutes;
  failS3Call?: boolean;
}) => {
  const msw = setupMsw(opts);

  const f = createUploadthing({
    errorFormatter(err) {
      // eslint-disable-next-line no-console
      console.log(err, err.cause);
      return { message: err.message };
    },
  });
  const router = {
    foo: f({ text: {} })
      .middleware((opts) => {
        middlewareMock(opts);
        return {};
      })
      .onUploadError(onErrorMock)
      .onUploadComplete(uploadCompleteMock),
    ...opts.extraRoutes,
  };

  const app = express();
  app.use(
    "/api/uploadthing",
    createRouteHandler({
      router,
      config: {
        uploadthingSecret: "sk_test_123",
        isDev: true,
      },
    }),
  );

  const server = app.listen();
  const port = (server.address() as { port: number }).port;

  const uploadFiles = genUploader<typeof router>({
    package: "vitest",
    url: `http://localhost:${port}`,
  });

  return {
    msw,
    uploadFiles,
    close: () => {
      server.close();
      msw.close();
    },
  };
};
