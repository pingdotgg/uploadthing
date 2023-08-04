import * as z from 'zod';

import { createUploadthing } from 'uploadthing/next';
import type { FileRouter } from 'uploadthing/next';

const f = createUploadthing({
  errorFormatter: (err) => ({
    message: err.message,
    zodError: err.cause instanceof z.ZodError ? err.cause.flatten() : null,
  }),
});

export const uploadRouter = {
  videoAndImage: f({
    image: {
      maxFileSize: '4MB',
      maxFileCount: 4,
    },
    video: {
      maxFileSize: '16MB',
    },
  })
    .middleware(() => ({}))
    .onUploadComplete(() => undefined),

  withInput: f(['image'])
    .input(
      z.object({
        foo: z.string().min(5),
      }),
    )
    .middleware(() => ({}))
    .onUploadComplete(() => undefined),

  withMdwr: f({
    image: {
      maxFileCount: 2,
      maxFileSize: '1MB',
    },
  })
    .middleware(({ req }) => {
      const h = req.headers.get('someProperty');

      if (!h) throw new Error('someProperty is required');

      return {
        someProperty: h,
        otherProperty: 'hello' as const,
      };
    })
    .onUploadComplete(({ metadata, file }) => {
      // eslint-disable-next-line no-unused-expressions
      metadata.someProperty;
      //       ^?
      // eslint-disable-next-line no-unused-expressions
      metadata.otherProperty;
      //       ^?

      // eslint-disable-next-line no-unused-expressions
      file;
      // ^?
    }),

  withoutMdwr: f({
    image: {
      maxFileCount: 2,
      maxFileSize: '16MB',
    },
  })
    .middleware(() => ({ testMetadata: 'lol' }))
    .onUploadComplete(({ metadata, file }) => {
      // eslint-disable-next-line no-unused-expressions
      metadata;
      // ^?

      // eslint-disable-next-line no-unused-expressions
      file;
      // ^?
    }),
} satisfies FileRouter;

export type OurFileRouter = typeof uploadRouter;
