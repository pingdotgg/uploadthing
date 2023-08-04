import type { Json } from '@uploadthing/shared';

import type { CreateBuilderOptions } from './internal/upload-builder';
import { createBuilder } from './internal/upload-builder.ts';

export * from './internal/types.ts';
export * as utapi from './sdk/index.ts';
export { createServerHandler } from './internal/edge.ts';

export const createUploadthing = <TErrorShape extends Json>(
  opts?: CreateBuilderOptions<TErrorShape>,
) => createBuilder<'web', TErrorShape>(opts);
