import { expectTypeOf, it } from 'vitest';
import * as z from 'zod';

import { createUploadthing } from 'uploadthing/server';

import { generateReactHelpers } from '../src/hooks.ts';

function ignoreErrors(fn: () => void) {
  try {
    fn();
  } catch {
    // no-op
  }
}

const f = createUploadthing();

const router = {
  exampleRoute: f(['image'])
    .middleware(() => ({ foo: 'bar' }))
    .onUploadComplete(({ metadata }) => {
      // eslint-disable-next-line no-unused-expressions
      metadata;
    }),

  withFooInput: f(['image'])
    .input(z.object({ foo: z.string() }))
    .middleware((opts) => ({ number: opts.input.foo.length }))
    .onUploadComplete(({ metadata }) => {
      // eslint-disable-next-line no-unused-expressions
      metadata;
    }),

  withBarInput: f(['image'])
    .input(z.object({ bar: z.number() }))
    .middleware((opts) => ({ square: opts.input.bar * opts.input.bar }))
    .onUploadComplete(({ metadata }) => {
      // eslint-disable-next-line no-unused-expressions
      metadata;
    }),
};

const { useUploadThing } = generateReactHelpers<typeof router>();
// `new File` doesn't work in test env without custom config. This will do for now.
const files = [new Blob([''], { type: 'image/png' }) as File];

it('typeerrors for invalid input', () => {
  ignoreErrors(() => {
    // eslint-disable-next-line max-len
    // @ts-expect-error - Argument of type '"bad route"' is not assignable to parameter of type '"exampleRoute"'.ts(2345)
    useUploadThing({ endpoint: 'bad route' });
  });

  ignoreErrors(() => {
    // Type should be good here since this is the route name
    const { startUpload } = useUploadThing('exampleRoute');

    // @ts-expect-error - there is no input on this endpoint
    // eslint-disable-next-line @typescript-eslint/no-floating-promises
    startUpload(files, { foo: 'bar' });
  });

  ignoreErrors(() => {
    const { startUpload } = useUploadThing('withFooInput');

    // @ts-expect-error - input should be required
    // eslint-disable-next-line @typescript-eslint/no-floating-promises
    startUpload(files);

    // @ts-expect-error - input is the wrong type
    // eslint-disable-next-line @typescript-eslint/no-floating-promises
    startUpload(files, 55);

    // @ts-expect-error - input matches another route, but not this one
    // eslint-disable-next-line @typescript-eslint/no-floating-promises
    startUpload(files, { bar: 1 });
  });
});

it('infers the input correctly', () => {
  ignoreErrors(() => {
    const { startUpload } = useUploadThing('exampleRoute');

    // we must allow undefined here to avoid weird types in other places
    // but it should be optional
    type _Input = Parameters<typeof startUpload>[1];
    expectTypeOf<_Input>().toEqualTypeOf<undefined>();
    // eslint-disable-next-line @typescript-eslint/no-floating-promises
    startUpload(files);
    // eslint-disable-next-line @typescript-eslint/no-floating-promises
    startUpload(files, undefined);
  });

  ignoreErrors(() => {
    const { startUpload } = useUploadThing('withFooInput');
    type Input = Parameters<typeof startUpload>[1];
    expectTypeOf<Input>().toEqualTypeOf<{ foo: string }>();
    // eslint-disable-next-line @typescript-eslint/no-floating-promises
    startUpload(files, { foo: 'bar' });
  });

  ignoreErrors(() => {
    const { startUpload } = useUploadThing('withBarInput');
    type Input = Parameters<typeof startUpload>[1];
    expectTypeOf<Input>().toEqualTypeOf<{ bar: number }>();
    // eslint-disable-next-line @typescript-eslint/no-floating-promises
    startUpload(files, { bar: 1 });
  });
});
