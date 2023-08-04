import { getServerSession } from 'next-auth';

import { createUploadthing } from 'uploadthing/next-legacy';
import type { FileRouter } from 'uploadthing/next-legacy';

import { options } from '~/pages/api/auth/[...nextauth].ts';

const f = createUploadthing();

export const uploadRouter = {
  withMdwr: f(['image'])
    .middleware(async ({ req, res }) => {
      const auth = await getServerSession(req, res, options);

      return {
        userEmail: auth?.user?.email,
        otherProperty: 'hello' as const,
      };
    })
    .onUploadComplete(({ file }) => {
      // eslint-disable-next-line no-unused-expressions
      file;
      // ^?
    }),

  withoutMdwr: f(['image'])
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
