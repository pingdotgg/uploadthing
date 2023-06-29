import { getStatusCodeFromError, UploadThingError } from "@uploadthing/shared";

import { UPLOADTHING_VERSION } from "../../constants";
import { defaultErrorFormatter } from "../error-formatter";
import type { RouterWithConfig } from "../handler";
import { buildPermissionsInfoHandler, buildRequestHandler } from "../handler";
import type { FileRouter } from "../types";

export const createNextRouteHandler = <TRouter extends FileRouter>(
  opts: RouterWithConfig<TRouter>,
) => {
  const requestHandler = buildRequestHandler<TRouter, "app">(opts);
  const errorFormatter = opts.errorFormatter ?? defaultErrorFormatter;

  const POST = async (req: Request) => {
    const response = await requestHandler({ req });

    if (response instanceof UploadThingError) {
      const formattedError = errorFormatter(response);
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

  const GET = () => {
    return new Response(JSON.stringify(getBuildPerms()), {
      status: 200,
      headers: {
        "x-uploadthing-version": UPLOADTHING_VERSION,
      },
    });
  };

  return { GET, POST };
};
