import { expectTypeOf, it } from "vitest";
import * as z from "zod";

import { createUploadthing } from "uploadthing/server";

import { generateReactHelpers } from "./useUploadThing";

function ignoreErrors(fn: () => void) {
  try {
    fn();
  } catch {
    // no-op
  }
}

const f = createUploadthing();

const router = {
  exampleRoute: f(["image"])
    .middleware(() => ({ foo: "bar" }))
    .onUploadComplete(({ metadata }) => {
      console.log(metadata);
    }),

  withFooInput: f(["image"])
    .input(z.object({ foo: z.string() }))
    .middleware(() => ({ foo: "bar" }))
    .onUploadComplete(({ metadata }) => {
      console.log(metadata);
    }),

  withBarInput: f(["image"])
    .input(z.object({ bar: z.number() }))
    .middleware(() => ({ foo: "bar" }))
    .onUploadComplete(({ metadata }) => {
      console.log(metadata);
    }),
};

const { useUploadThing } = generateReactHelpers<typeof router>();
const files = [new File([""], "foo.txt")];

it("typeerrors for invalid input", () => {
  ignoreErrors(() => {
    // @ts-expect-error - Argument of type '"bad route"' is not assignable to parameter of type '"exampleRoute"'.ts(2345)
    useUploadThing({ endpoint: "bad route" });
  });

  ignoreErrors(() => {
    // Type should be good here since this is the route name
    const { startUpload } = useUploadThing({ endpoint: "exampleRoute" });

    // @ts-expect-error - there is no input on this endpoint
    void startUpload(files, { foo: "bar" });
  });

  ignoreErrors(() => {
    const { startUpload } = useUploadThing({ endpoint: "withFooInput" });

    // @ts-expect-error - input should be required
    void startUpload(files);

    // @ts-expect-error - input is the wrong type
    void startUpload(files, 55);

    // @ts-expect-error - input matches another route, but not this one
    void startUpload(files, { bar: 1 });
  });
});

it("infers the input correctly", () => {
  ignoreErrors(() => {
    const { startUpload } = useUploadThing({ endpoint: "exampleRoute" });
    type Input = Parameters<typeof startUpload>[1];
    expectTypeOf<Input>().toEqualTypeOf<undefined>();
    void startUpload(files);
  });

  ignoreErrors(() => {
    const { startUpload } = useUploadThing({ endpoint: "withFooInput" });
    type Input = Parameters<typeof startUpload>[1];
    expectTypeOf<Input>().toEqualTypeOf<{ foo: string }>();
    void startUpload(files, { foo: "bar" });
  });

  ignoreErrors(() => {
    const { startUpload } = useUploadThing({ endpoint: "withBarInput" });
    type Input = Parameters<typeof startUpload>[1];
    expectTypeOf<Input>().toEqualTypeOf<{ bar: number }>();
    void startUpload(files, { bar: 1 });
  });
});
