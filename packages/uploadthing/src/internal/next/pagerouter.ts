import type { NextApiRequest, NextApiResponse } from "next";

import { getStatusCodeFromError, UploadThingError } from "@uploadthing/shared";

import { UPLOADTHING_VERSION } from "../../constants";
import { defaultErrorFormatter } from "../error-formatter";
import type { RouterWithConfig } from "../handler";
import { buildPermissionsInfoHandler, buildRequestHandler } from "../handler";
import type { FileRouter } from "../types";

export const createNextPageApiHandler = <TRouter extends FileRouter>(
  opts: RouterWithConfig<TRouter>,
) => {
  const requestHandler = buildRequestHandler<TRouter, "pages">(opts);
  const errorFormatter = opts.errorFormatter ?? defaultErrorFormatter;

  const getBuildPerms = buildPermissionsInfoHandler<TRouter>(opts);

  return async (req: NextApiRequest, res: NextApiResponse) => {
    // Return valid endpoints
    if (req.method === "GET") {
      const perms = getBuildPerms();
      res.status(200).json(perms);
      return;
    }

    // Get inputs from query and params
    const params = req.query;
    const uploadthingHook = req.headers["uploadthing-hook"];
    const slug = params["slug"];
    const actionType = params["actionType"];

    // Validate inputs
    if (slug && typeof slug !== "string")
      return res.status(400).send("`slug` must not be an array");
    if (actionType && typeof actionType !== "string")
      return res.status(400).send("`actionType` must not be an array");
    if (uploadthingHook && typeof uploadthingHook !== "string")
      return res.status(400).send("`uploadthingHook` must not be an array");
    if (typeof req.body !== "string")
      return res.status(400).send("Request body must be a JSON string");

    const standardRequest = {
      ...req,
      // eslint-disable-next-line @typescript-eslint/no-unsafe-argument
      json: () => Promise.resolve(JSON.parse(req.body)),
      headers: {
        get: (key: string) => req.headers[key],
      } as Headers,
    };

    const response = await requestHandler({
      uploadthingHook,
      slug,
      actionType,
      req: standardRequest,
      res,
    });

    res.setHeader("x-uploadthing-version", UPLOADTHING_VERSION);

    if (response instanceof UploadThingError) {
      res.status(getStatusCodeFromError(response));
      res.setHeader("x-uploadthing-version", UPLOADTHING_VERSION);
      const formattedError = errorFormatter(response);
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
