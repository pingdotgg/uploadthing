/* eslint-disable @typescript-eslint/no-empty-function */
/* eslint-disable @typescript-eslint/ban-types */
import type { NextApiRequest, NextApiResponse } from "next";
import { genUploader } from "../client";
import type { FileRouter } from "./types";
import { createBuilder } from "./upload-builder";
import { expect, it, expectTypeOf } from "vitest";
import { NextRequest } from "next/server";

const badReqMock = {
  headers: {
    get(key: string) {
      if (key === "header1") return "woohoo";
      return null;
    },
  },
} as unknown as Request;

it("typeerrors for invalid input", async () => {
  const f = createBuilder();

  // @ts-expect-error - invalid file type
  f.fileTypes(["png"]);

  // @ts-expect-error - invalid size format - should be 1GB
  f.limits("max 2 files of 1gb each");

  // @ts-expect-error - should return an object
  f.middleware(async () => {
    return null;
  });

  // @ts-expect-error - res does not exist (`pages` flag not set)
  f.middleware(async (req, res) => {
    return {};
  });

  f.middleware(() => ({ foo: "bar" })).onUploadComplete(({ metadata }) => {
    // @ts-expect-error - bar does not exist
    metadata.bar;
    // @ts-expect-error - bar does not exist on foo
    metadata.foo.bar;
  });
});

it("uses defaults for not-chained", async () => {
  const f = createBuilder();

  const uploadable = f.onUploadComplete(() => {});

  expect(uploadable._def.fileTypes).toEqual(["image"]);
  expect(uploadable._def.maxSize).toEqual("1MB");

  const metadata = await uploadable._def.middleware(badReqMock);
  expect(metadata).toEqual({});
  expectTypeOf(metadata).toMatchTypeOf<{}>();
});

it("passes `Request` by default", async () => {
  const f = createBuilder();

  f.middleware(async (req) => {
    expectTypeOf(req).toMatchTypeOf<Request>();

    return {};
  });
});

it("passes `NextRequest` for /app", async () => {
  const f = createBuilder<"app">();

  f.middleware(async (req) => {
    expectTypeOf(req).toMatchTypeOf<NextRequest>();
    return { nextUrl: req.nextUrl };
  });
});

it("passes `res` for /pages", async () => {
  const f = createBuilder<"pages">();

  f.middleware(async (req, res) => {
    expectTypeOf(req).toMatchTypeOf<NextApiRequest>();
    expectTypeOf(res).toMatchTypeOf<NextApiResponse>();

    return {};
  });
});

it("smoke", async () => {
  const f = createBuilder();

  const uploadable = f
    .fileTypes(["image", "video"])
    .limits("max 2 files of 1GB each")
    .middleware(async (req) => {
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

  expect(uploadable._def.fileTypes).toEqual(["image", "video"]);
  expect(uploadable._def.maxSize).toEqual("1GB");

  const metadata = await uploadable._def.middleware(badReqMock);
  expect(metadata).toEqual({ header1: "woohoo", userId: "123" });
});

it("genuploader", async () => {
  const f = createBuilder();
  const uploadable = f
    .fileTypes(["image", "video"])
    .limits("max 2 files of 1GB each")
    .onUploadComplete(({ file, metadata }) => {});

  const router = { uploadable } satisfies FileRouter;

  const uploader = genUploader<typeof router>();

  try {
    // @ts-expect-error - Argument of type '"random"' is not assignable to parameter of type '"uploadable"'
    await uploader([], "random");
  } catch (e) {
    // expected this to error since we're not in a real env so it can't fetch
  }
});
