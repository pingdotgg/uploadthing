import type { APIRoute } from "astro";

import { getStatusCodeFromError, UploadThingError } from "@uploadthing/shared";

import { UPLOADTHING_VERSION } from "../constants";
import { defaultErrorFormatter } from "./error-formatter";
import type { RouterWithConfig } from "./handler";
import { buildPermissionsInfoHandler, buildRequestHandler } from "./handler";
import type { FileRouter, inferErrorShape } from "./types";

export const createAstroRouteHandler = <TRouter extends FileRouter>(
  opts: RouterWithConfig<TRouter>,
) => {
  const requestHandler = buildRequestHandler<TRouter, "web">(opts);

  const post: APIRoute = async ({ request: req }) => {
    // Astro stores env vars in import.meta.env,
    // but library code expects them to be in process.env
    process.env.UPLOADTHING_APP_ID =
      (import.meta as unknown as { env: { UPLOADTHING_APP_ID: string } }).env
        .UPLOADTHING_APP_ID ?? process.env.UPLOADTHING_APP_ID;

    process.env.UPLOADTHING_SECRET =
      (import.meta as unknown as { env: { UPLOADTHING_SECRET: string } }).env
        .UPLOADTHING_SECRET ?? process.env.UPLOADTHING_SECRET;

    const response = await requestHandler({ req });
    const errorFormatter =
      opts.router[Object.keys(opts.router)[0]]?._def.errorFormatter ??
      defaultErrorFormatter;

    if (response instanceof UploadThingError) {
      const formattedError = errorFormatter(
        response,
      ) as inferErrorShape<TRouter>;
      return new Response(JSON.stringify(formattedError), {
        status: getStatusCodeFromError(response),
        headers: {
          "x-uploadthing-version": UPLOADTHING_VERSION,
        },
      });
    }

    if (response.status !== 200) {
      // We messed up - this should never happen
      return new Response("An unknown error occured", {
        status: 500,
        headers: {
          "x-uploadthing-version": UPLOADTHING_VERSION,
        },
      });
    }

    return new Response(JSON.stringify(response.body), {
      status: response.status,
      headers: {
        "x-uploadthing-version": UPLOADTHING_VERSION,
      },
    });
  };

  const getBuildPerms = buildPermissionsInfoHandler<TRouter>(opts);

  const get = () => {
    return new Response(JSON.stringify(getBuildPerms()), {
      status: 200,
      headers: {
        "x-uploadthing-version": UPLOADTHING_VERSION,
      },
    });
  };

  return { get, post };
};
