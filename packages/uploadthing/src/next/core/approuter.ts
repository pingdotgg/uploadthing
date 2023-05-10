import {
  RouterWithConfig,
  buildPermissionsInfoHandler,
  buildRequestHandler,
} from "../../internal/handler";
import type { FileRouter } from "../../types";

// eslint-disable-next-line @typescript-eslint/no-var-requires
const UPLOADTHING_VERSION = require("../../../package.json").version;

export const createNextRouteHandler = <TRouter extends FileRouter>(
  opts: RouterWithConfig<TRouter>
) => {
  const requestHandler = buildRequestHandler<TRouter, "app">(opts);

  const POST = async (req: Request) => {
    const params = new URL(req.url).searchParams;
    const uploadthingHook = req.headers.get("uploadthing-hook") ?? undefined;
    const slug = params.get("slug") ?? undefined;
    const actionType = params.get("actionType") ?? undefined;

    const response = await requestHandler({
      uploadthingHook,
      slug,
      actionType,
      req,
    });
    if (response.status === 200) {
      return new Response(JSON.stringify(response.body), {
        status: response.status,
        headers: {
          "x-uploadthing-version": UPLOADTHING_VERSION,
        },
      });
    }

    return new Response("Error", {
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
