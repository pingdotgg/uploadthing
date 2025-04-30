import { ParseError } from "effect/ParseResult";
import * as Schema from "effect/Schema";
import * as v from "valibot";
import { expect, expectTypeOf, it } from "vitest";
import * as z from "zod";

import { noop } from "@uploadthing/shared";

import { getParseFn, ParserError } from "../../src/_internal/parser";
import { createBuilder } from "../../src/_internal/upload-builder";
import type { inferEndpointInput } from "../../src/types";

const f = createBuilder<{ req: Request; res: undefined; event: undefined }>();

it.each([
  ["zod", z.string()],
  ["valibot", v.string()],
  ["effect/schema", Schema.String],
])("primitive string schema (%s)", async (_, input) => {
  const fileRoute = f(["image"])
    .input(input)
    .middleware((opts) => {
      expectTypeOf<string>(opts.input);
      return {};
    })
    .onUploadComplete(noop);

  type Input = inferEndpointInput<typeof fileRoute>;
  expectTypeOf<Input>().toMatchTypeOf<string>();

  const parsedInput = await getParseFn(fileRoute.inputParser)("bar");
  expect(parsedInput).toEqual("bar");
});

it.each([
  ["zod", z.object({ foo: z.string() })],
  ["valibot", v.object({ foo: v.string() })],
  ["effect/schema", Schema.Struct({ foo: Schema.String })],
])("object input (%s)", async (_, input) => {
  const fileRoute = f(["image"])
    .input(input)
    .middleware((opts) => {
      expectTypeOf<{ foo: string }>(opts.input);
      return {};
    })
    .onUploadComplete(noop);

  type Input = inferEndpointInput<typeof fileRoute>;
  expectTypeOf<Input>().toMatchTypeOf<{ foo: string }>();

  const parsedInput = await getParseFn(fileRoute.inputParser)({ foo: "bar" });
  expect(parsedInput).toEqual({ foo: "bar" });
});

it.each([
  ["zod", z.object({ foo: z.string() }).optional()],
  ["valibot", v.optional(v.object({ foo: v.string() }))],
  // FIXME: Effect's optional schema wraps the entire type which makes it incompatible with the current approach
  //   [
  //     "effect/schema",
  //     Schema.Struct({ foo: Schema.String }).pipe(Schema.optional),
  //   ],
])("optional input (%s)", async (_, input) => {
  const fileRoute = f(["image"])
    .input(input)
    .middleware((opts) => {
      expectTypeOf<{ foo: string } | undefined>(opts.input);
      return {};
    })
    .onUploadComplete(noop);

  type Input = inferEndpointInput<typeof fileRoute>;
  expectTypeOf<Input>().toMatchTypeOf<{ foo: string } | undefined>();

  const parsedInput = await getParseFn(fileRoute.inputParser)({ foo: "bar" });
  expect(parsedInput).toEqual({ foo: "bar" });
});

it("validation fails when input is invalid (zod)", async () => {
  const fileRoute = f(["image"]).input(z.string()).onUploadComplete(noop);
  const err = await getParseFn(fileRoute.inputParser)(123).catch((e) => e);
  expect(err).toBeInstanceOf(z.ZodError);
});
it("validation fails when input is invalid (valibot)", async () => {
  const fileRoute = f(["image"]).input(v.string()).onUploadComplete(noop);
  const err = await getParseFn(fileRoute.inputParser)(123).catch((e) => e);
  expect(err).toBeInstanceOf(ParserError);
  expect(Array.isArray(err.cause)).toBe(true);
});
it("validation fails when input is invalid (effect/schema)", async () => {
  const fileRoute = f(["image"]).input(Schema.String).onUploadComplete(noop);
  const err = await getParseFn(fileRoute.inputParser)(123).catch((e) => e);
  expect(err).toBeInstanceOf(ParserError);
  expect(err.cause).toBeInstanceOf(ParseError);
});

it("with data transforming (zod)", async () => {
  f(["image"]).input(
    // @ts-expect-error - Date -> string is not JSON serializable
    z.object({
      date: z.date().transform((s) => s.toISOString()),
    }),
  );

  // string -> Date should work
  const fileRoute = f(["image"])
    .input(
      z.object({
        date: z.string().transform((s) => new Date(s)),
      }),
    )
    .middleware((opts) => {
      expectTypeOf<{ date: Date }>(opts.input);
      return {};
    })
    .onUploadComplete(noop);

  type Input = inferEndpointInput<typeof fileRoute>;
  expectTypeOf<Input>().toMatchTypeOf<{ date: string }>();

  const parsedInput = await getParseFn(fileRoute.inputParser)({
    date: "2024-01-01",
  });
  expect(parsedInput).toEqual({ date: new Date("2024-01-01") });
});
it("with data transforming (valibot)", async () => {
  f(["image"]).input(
    // @ts-expect-error - Date -> string is not JSON serializable
    v.object({
      date: v.pipe(
        v.date(),
        v.transform((d) => d.toISOString()),
      ),
    }),
  );

  // string -> Date should work
  const fileRoute = f(["image"])
    .input(
      v.object({
        date: v.pipe(
          v.string(),
          v.transform((s) => new Date(s)),
        ),
      }),
    )
    .middleware((opts) => {
      expectTypeOf<{ date: Date }>(opts.input);
      return {};
    })
    .onUploadComplete(noop);

  type Input = inferEndpointInput<typeof fileRoute>;
  expectTypeOf<Input>().toMatchTypeOf<{ date: string }>();

  const parsedInput = await getParseFn(fileRoute.inputParser)({
    date: "2024-01-01",
  });
  expect(parsedInput).toEqual({ date: new Date("2024-01-01") });
});
it("with data transforming (effect/schema)", async () => {
  const fileRoute = f(["image"])
    .input(
      Schema.Struct({
        date: Schema.Date,
      }),
    )
    .middleware((opts) => {
      expectTypeOf<{ date: Date }>(opts.input);
      return {};
    })
    .onUploadComplete(noop);

  type Input = inferEndpointInput<typeof fileRoute>;
  expectTypeOf<Input>().toMatchTypeOf<{ date: string }>();

  const parsedInput = await getParseFn(fileRoute.inputParser)({
    date: "2024-01-01",
  });
  expect(parsedInput).toEqual({ date: new Date("2024-01-01") });
});

it("type errors for non-JSON data types (zod)", () => {
  f(["image"])
    // @ts-expect-error - Set is not a valid JSON type
    .input(z.object({ foo: z.set(z.string()) }))
    .middleware(() => {
      return {};
    })
    .onUploadComplete(noop);
});
it("type errors for non-JSON data types (valibot)", () => {
  f(["image"])
    // @ts-expect-error - Set is not a valid JSON type
    .input(v.object({ foo: v.set(v.string()) }))
    .middleware(() => {
      return {};
    })
    .onUploadComplete(noop);
});
it("type errors for non-JSON data types (effect/schema)", () => {
  f(["image"])
    // @ts-expect-error - Set is not a valid JSON type
    .input(Schema.Struct({ foo: Schema.Set(Schema.String) }))
    .middleware(() => {
      return {};
    })
    .onUploadComplete(noop);
});
