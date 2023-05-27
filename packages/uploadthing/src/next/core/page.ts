import { UPLOADTHING_VERSION } from "../../constants";
import {
  RouterWithConfig,
  buildPermissionsInfoHandler,
  buildRequestHandler,
} from "../../internal/handler";
import type { FileRouter } from "../../types";
import type { NextApiRequest, NextApiResponse } from "next";

export const createNextPageApiHandler = <TRouter extends FileRouter>(
  opts: RouterWithConfig<TRouter>
) => {
  const requestHandler = buildRequestHandler<TRouter, "pages">(opts);

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

    const standardRequest = {
      ...req,
      json: () => Promise.resolve(req.body),
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

    res.status(response.status);
    res.setHeader("x-uploadthing-version", UPLOADTHING_VERSION);
    if (response.status === 200) {
      return res.json(response.body);
    }
    return res.send(response.message ?? "Unable to upload file.");
  };
};
