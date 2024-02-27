/* eslint-disable @typescript-eslint/no-empty-function */

import { expect, expectTypeOf, it } from "vitest";
import { z } from "zod";

import { UTFiles } from "../src/internal/types";
import { createBuilder } from "../src/internal/upload-builder";

it("typeerrors for invalid input", () => {
  const f = createBuilder<{ req: Request; res: undefined; event: undefined }>();

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

  f(["image"])
    .input(z.object({ foo: z.string() }))
    // @ts-expect-error - cannot set multiple inputs
    .input(z.object({ bar: z.string() }))
    .middleware(() => {
      return {};
    });

  f(["image"])
    // @ts-expect-error - date is not allowed
    .input(z.object({ foo: z.date() }))
    .middleware(() => {
      return {};
    });

  f(["image"])
    // @ts-expect-error - set is not allowed
    .input(z.object({ foo: z.set() }))
    .middleware(() => {
      return {};
    });

  f(["image"])
    .input(z.object({ foo: z.string() }))
    .middleware((opts) => {
      expectTypeOf<{ foo: string }>(opts.input);
      return {};
    })
    // @ts-expect-error - cannot set multiple middlewares
    .middleware(() => {});
});

it("uses defaults for not-chained", async () => {
  const f = createBuilder<{ req: Request; res: undefined; event: undefined }>();

  const uploadable = f(["image"]).onUploadComplete(() => {});

  expect(uploadable._def.routerConfig).toEqual(["image"]);

  const metadata = await uploadable._def.middleware({
    req: new Request("http://localhost", {
      headers: { header1: "woohoo" },
    }),
    res: undefined,
    event: undefined,
    input: undefined,
    files: [{ name: "test.txt", size: 123456 }],
  });
  expect(metadata).toEqual({});
  expectTypeOf<Record<string, never>>(metadata);
});

it("allows async middleware", () => {
  const f = createBuilder<{ req: Request; res: undefined; event: undefined }>();

  f(["image"])
    .middleware((opts) => {
      expectTypeOf<Request>(opts.req);

      return { foo: "bar" } as const;
    })
    .onUploadComplete((opts) => {
      expectTypeOf<{ foo: "bar" }>(opts.metadata);
    });
});

it("with input", () => {
  const f = createBuilder<{ req: Request; res: undefined; event: undefined }>();
  f(["image"])
    .input(z.object({ foo: z.string() }))
    .middleware((opts) => {
      expectTypeOf<{ foo: string }>(opts.input);
      return {};
    });
});

it("with optional input", () => {
  const f = createBuilder<{ req: Request; res: undefined; event: undefined }>();
  f(["image"])
    .input(z.object({ foo: z.string() }).optional())
    .middleware((opts) => {
      expectTypeOf<{ foo: string } | undefined>(opts.input);
      return {};
    });
});

it("can append a customId", () => {
  const f = createBuilder<{ req: Request; res: undefined; event: undefined }>();
  f(["image"])
    .middleware(({ files }) => {
      const overrides = files.map((f) => ({ ...f, customId: "123" }));
      return { [UTFiles]: overrides, foo: "bar" };
    })
    .onUploadComplete(({ metadata, file }) => {
      expectTypeOf<{ foo: string }>(metadata);
      expectTypeOf<{ customId: string | null }>(file);
    });
});

it("smoke", async () => {
  const f = createBuilder<{ req: Request; res: undefined; event: undefined }>();

  const uploadable = f(["image", "video"])
    .input(z.object({ foo: z.string() }))
    .middleware((opts) => {
      expect(opts.input).toEqual({ foo: "bar" });
      expectTypeOf<{ foo: string }>(opts.input);
      expectTypeOf<{ name: string; size: number }[]>(opts.files);

      const header1 = opts.req.headers.get("header1");

      return { header1, userId: "123" as const };
    })
    .onUploadComplete(({ file, metadata }) => {
      // expect(file).toEqual({ name: "file", url: "http://localhost" })
      expectTypeOf<{ name: string; url: string }>(file);

      expect(metadata).toEqual({ header1: "woohoo", userId: "123" });
      expectTypeOf<{
        header1: string | null;
        userId: "123";
      }>(metadata);
    });

  expect(uploadable._def.routerConfig).toEqual(["image", "video"]);

  const metadata = await uploadable._def.middleware({
    req: new Request("http://localhost", {
      headers: { header1: "woohoo" },
    }),
    input: { foo: "bar" },
    res: undefined,
    event: undefined,
    files: [{ name: "test.txt", size: 123456 }],
  });
  expect(metadata).toEqual({ header1: "woohoo", userId: "123" });
});
