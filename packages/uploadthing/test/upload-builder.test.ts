/* eslint-disable @typescript-eslint/no-empty-function */

import type { NextApiRequest, NextApiResponse } from 'next';
import type { NextRequest } from 'next/server';
import { expect, expectTypeOf, it } from 'vitest';
import { z } from 'zod';

import type { UnsetMarker } from '../src/internal/types';
import { createBuilder } from '../src/internal/upload-builder.ts';

const badReqMock = {
  headers: {
    get(key: string) {
      if (key === 'header1') return 'woohoo';
      return null;
    },
  },
} as unknown as Request;

it('typeerrors for invalid input', () => {
  const f = createBuilder();

  // @ts-expect-error - invalid file type
  f(['png']);

  // @ts-expect-error - invalid size format
  f({ image: { maxFileSize: '1gb' } });

  // @ts-expect-error - should return an object
  f(['image']).middleware(() => null);

  // @ts-expect-error - res does not exist (`pages` flag not set)
  // eslint-disable-next-line no-unused-vars
  f(['image']).middleware((_req, _res) => ({}));

  f(['image'])
    .middleware(() => ({ foo: 'bar' }))
    .onUploadComplete(({ metadata }) => {
      // @ts-expect-error - bar does not exist
      // eslint-disable-next-line no-unused-expressions
      metadata.bar;
      // @ts-expect-error - bar does not exist on foo
      // eslint-disable-next-line no-unused-expressions
      metadata.foo.bar;
    });

  f(['image'])
    .input(z.object({ foo: z.string() }))
    // @ts-expect-error - cannot set multiple inputs
    .input(z.object({ bar: z.string() }))
    .middleware(() => ({}));

  f(['image'])
    // @ts-expect-error - date is not allowed
    .input(z.object({ foo: z.date() }))
    .middleware(() => ({}));

  f(['image'])
    // @ts-expect-error - set is not allowed
    .input(z.object({ foo: z.set() }))
    .middleware(() => ({}));

  f(['image'])
    .input(z.object({ foo: z.string() }))
    .middleware((opts) => {
      expectTypeOf(opts.input).toEqualTypeOf<{ foo: string }>();
      return {};
    })
    // @ts-expect-error - cannot set multiple middlewares
    .middleware(() => {});
});

it('uses defaults for not-chained', async () => {
  const f = createBuilder();

  const uploadable = f(['image']).onUploadComplete(() => {});

  // eslint-disable-next-line no-underscore-dangle
  expect(uploadable._def.routerConfig).toEqual(['image']);

  // eslint-disable-next-line no-underscore-dangle
  const metadata = await uploadable._def.middleware({
    req: badReqMock,
    input: {} as UnsetMarker,
  });
  expect(metadata).toEqual({});
  expectTypeOf(metadata).toMatchTypeOf<{}>();
});

it('passes `Request` by default', () => {
  const f = createBuilder();

  f(['image']).middleware((opts) => {
    expectTypeOf(opts.req).toMatchTypeOf<Request>();

    return {};
  });
});

it('allows async middleware', () => {
  const f = createBuilder();

  f(['image'])
    .middleware((opts) => {
      expectTypeOf(opts.req).toMatchTypeOf<Request>();

      return { foo: 'bar' } as const;
    })
    .onUploadComplete((opts) => {
      expectTypeOf(opts.metadata).toMatchTypeOf<{ foo: 'bar' }>();
    });
});

it('passes `NextRequest` for /app', () => {
  const f = createBuilder<'app'>();

  f(['image']).middleware((opts) => {
    expectTypeOf(opts.req).toMatchTypeOf<NextRequest>();
    return { nextUrl: opts.req.nextUrl };
  });
});

it('passes `res` for /pages', () => {
  const f = createBuilder<'pages'>();

  f(['image']).middleware((opts) => {
    expectTypeOf(opts.req).toMatchTypeOf<NextApiRequest>();
    expectTypeOf(opts.res).toMatchTypeOf<NextApiResponse>();

    return {};
  });
});

it('with input', () => {
  const f = createBuilder();
  f(['image'])
    .input(z.object({ foo: z.string() }))
    .middleware((opts) => {
      expectTypeOf(opts.input).toEqualTypeOf<{ foo: string }>();
      return {};
    });
});

it('smoke', async () => {
  const f = createBuilder();

  const uploadable = f(['image', 'video'])
    .input(z.object({ foo: z.string() }))
    .middleware((opts) => {
      expect(opts.input).toEqual({ foo: 'bar' });
      expectTypeOf(opts.input).toMatchTypeOf<{ foo: string }>();

      const header1 = opts.req.headers.get('header1');

      return { header1, userId: '123' as const };
    })
    .onUploadComplete(({ file, metadata }) => {
      // expect(file).toEqual({ name: "file", url: "http://localhost" })
      expectTypeOf(file).toMatchTypeOf<{ name: string; url: string }>();

      expect(metadata).toEqual({ header1: 'woohoo', userId: '123' });
      expectTypeOf(metadata).toMatchTypeOf<{
        header1: string | null;
        userId: '123';
      }>();
    });

  // eslint-disable-next-line no-underscore-dangle
  expect(uploadable._def.routerConfig).toEqual(['image', 'video']);

  // eslint-disable-next-line no-underscore-dangle
  const metadata = await uploadable._def.middleware({
    req: badReqMock,
    input: { foo: 'bar' },
  });
  expect(metadata).toEqual({ header1: 'woohoo', userId: '123' });
});
