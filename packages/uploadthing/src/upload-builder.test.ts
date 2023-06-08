/* eslint-disable @typescript-eslint/no-empty-function */

import type { NextApiRequest, NextApiResponse } from "next";
import type { NextRequest } from "next/server";
import { expect, expectTypeOf, it } from "vitest";

import { genUploader } from "../client";
import { FileRouter } from "./internal/types";
import { createBuilder } from "./upload-builder";

const badReqMock = {
  headers: {
    get(key: string) {
      if (key === "header1") return "woohoo";
      return null;
    },
  },
} as unknown as Request;

it("typeerrors for invalid input", () => {
  const f = createBuilder();

  // @ts-expect-error - invalid file type
  f(["png"]);

  // @ts-expect-error - invalid size format
  f({ image: { maxFileSize: "1gb" } });

  // @ts-expect-error - should return an object
  f(["image"]).middleware(() => {
    return null;
  });

  // @ts-expect-error - res does not exist (`pages` flag not set)
  f(["image"]).middleware((_req, _res) => {
    return {};
  });

  f(["image"])
    .middleware(() => ({ foo: "bar" }))
    .onUploadComplete(({ metadata }) => {
      // @ts-expect-error - bar does not exist
      metadata.bar;
      // @ts-expect-error - bar does not exist on foo
      metadata.foo.bar;
    });
});

it("uses defaults for not-chained", async () => {
  const f = createBuilder();

  const uploadable = f(["image"]).onUploadComplete(() => {});

  expect(uploadable._def.routerConfig).toEqual(["image"]);

  const metadata = await uploadable._def.middleware(badReqMock);
  expect(metadata).toEqual({});
  expectTypeOf(metadata).toMatchTypeOf<{}>();
});

it("passes `Request` by default", () => {
  const f = createBuilder();

  f(["image"]).middleware((req) => {
    expectTypeOf(req).toMatchTypeOf<Request>();

    return {};
  });
});

it("allows async middleware", () => {
  const f = createBuilder();

  f(["image"])
    .middleware((req) => {
      expectTypeOf(req).toMatchTypeOf<Request>();

      return { foo: "bar" } as const;
    })
    .onUploadComplete((opts) => {
      expectTypeOf(opts.metadata).toMatchTypeOf<{ foo: "bar" }>();
    });
});

it("passes `NextRequest` for /app", () => {
  const f = createBuilder<"app">();

  f(["image"]).middleware((req) => {
    expectTypeOf(req).toMatchTypeOf<NextRequest>();
    return { nextUrl: req.nextUrl };
  });
});

it("passes `res` for /pages", () => {
  const f = createBuilder<"pages">();

  f(["image"]).middleware((req, res) => {
    expectTypeOf(req).toMatchTypeOf<NextApiRequest>();
    expectTypeOf(res).toMatchTypeOf<NextApiResponse>();

    return {};
  });
});

it("smoke", async () => {
  const f = createBuilder();

  const uploadable = f(["image", "video"])
    .middleware((req) => {
      const header1 = req.headers.get("header1");

      return { header1, userId: "123" as const };
    })
    .onUploadComplete(({ file, metadata }) => {
      // expect(file).toEqual({ name: "file", url: "http://localhost" })
      expectTypeOf(file).toMatchTypeOf<{ name: string; url: string }>();

      expect(metadata).toEqual({ header1: "woohoo", userId: "123" });
      expectTypeOf(metadata).toMatchTypeOf<{
        header1: string | null;
        userId: "123";
      }>();
    });

  expect(uploadable._def.routerConfig).toEqual(["image", "video"]);

  const metadata = await uploadable._def.middleware(badReqMock);
  expect(metadata).toEqual({ header1: "woohoo", userId: "123" });
});

it("genuploader", async () => {
  const f = createBuilder();
  const uploadable = f(["image", "video"]).onUploadComplete(() => {});

  const router = { uploadable } satisfies FileRouter;

  const uploader = genUploader<typeof router>();

  try {
    // @ts-expect-error - Argument of type '"random"' is not assignable to parameter of type '"uploadable"'
    await uploader([], "random");
  } catch (e) {
    // expected this to error since we're not in a real env so it can't fetch
  }
});
