import type { NextApiRequest, NextApiResponse } from "next";

import { UPLOADTHING_VERSION } from "../../constants";
import { getStatusCodeFromError, UploadThingError } from "../../shared";
import { defaultErrorFormatter } from "../error-formatter";
import type { RouterWithConfig } from "../handler";
import { buildPermissionsInfoHandler, buildRequestHandler } from "../handler";
import type { FileRouter, inferErrorShape } from "../types";

export const createNextPageApiHandler = <TRouter extends FileRouter>(
  opts: RouterWithConfig<TRouter>,
) => {
  const requestHandler = buildRequestHandler<TRouter, "pages">(opts);
  const errorFormatter =
    opts.router[Object.keys(opts.router)[0]]?._def.errorFormatter ??
    defaultErrorFormatter;

  const getBuildPerms = buildPermissionsInfoHandler<TRouter>(opts);

  return async (req: NextApiRequest, res: NextApiResponse) => {
    // Return valid endpoints
    if (req.method === "GET") {
      const perms = getBuildPerms();
      res.status(200).json(perms);
      return;
    }

    const response = await requestHandler({
      req: Object.assign(req, {
        json: () =>
          Promise.resolve(
            JSON.parse(
              // eslint-disable-next-line @typescript-eslint/no-unsafe-argument
              req.body,
            ),
          ),
      }),
      res,
    });

    res.setHeader("x-uploadthing-version", UPLOADTHING_VERSION);

    if (response instanceof UploadThingError) {
      res.status(getStatusCodeFromError(response));
      res.setHeader("x-uploadthing-version", UPLOADTHING_VERSION);
      const formattedError = errorFormatter(
        response,
      ) as inferErrorShape<TRouter>;
      return res.json(formattedError);
    }

    if (response.status !== 200) {
      // We messed up - this should never happen
      res.status(500);
      return res.send("An unknown error occured");
    }

    res.status(response.status);
    return res.json(response.body);
  };
};
