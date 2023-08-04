import type { NextApiRequest, NextApiResponse } from 'next';

import { getStatusCodeFromError, UploadThingError } from '@uploadthing/shared';

import { UPLOADTHING_VERSION } from '../../constants.ts';
import { defaultErrorFormatter } from '../error-formatter.ts';
import type { RouterWithConfig } from '../handler';
import { buildPermissionsInfoHandler, buildRequestHandler } from '../handler.ts';
import type { FileRouter, inferErrorShape } from '../types';

export const createNextPageApiHandler = <TRouter extends FileRouter>(
  opts: RouterWithConfig<TRouter>,
) => {
  const requestHandler = buildRequestHandler<TRouter, 'pages'>(opts);
  // eslint-disable-next-line no-underscore-dangle
  const errorFormatter = opts.router[Object.keys(opts.router)[0]]?._def.errorFormatter
    ?? defaultErrorFormatter;

  const getBuildPerms = buildPermissionsInfoHandler<TRouter>(opts);

  return async (req: NextApiRequest, res: NextApiResponse) => {
    // Return valid endpoints
    if (req.method === 'GET') {
      const perms = getBuildPerms();
      return res.status(200).json(perms);
    }

    const standardRequest = {
      ...req,
      // eslint-disable-next-line @typescript-eslint/no-unsafe-argument
      json: () => Promise.resolve(JSON.parse(req.body)),
      headers: {
        get: (key: string) => req.headers[key],
      } as Headers,
    };

    const response = await requestHandler({
      req: standardRequest,
      res,
    });

    res.setHeader('x-uploadthing-version', UPLOADTHING_VERSION);

    if (response instanceof UploadThingError) {
      res.status(getStatusCodeFromError(response));
      res.setHeader('x-uploadthing-version', UPLOADTHING_VERSION);
      const formattedError = errorFormatter(
        response,
      ) as inferErrorShape<TRouter>;
      return res.json(formattedError);
    }

    if (response.status !== 200) {
      // We messed up - this should never happen
      res.status(500);
      return res.send('An unknown error occured');
    }

    res.status(response.status);
    return res.json(response.body);
  };
};

export const AIRBNB_IS_STUPID = true;
