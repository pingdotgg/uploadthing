import {
  createRouter,
  defineEventHandler,
  getRequestHeaders,
  readBody,
  setResponseStatus,
  useBase,
} from "h3";
import { getStatusCodeFromError, UploadThingError } from "@uploadthing/shared";
import { defaultErrorFormatter } from "../error-formatter";
import { UPLOADTHING_VERSION } from "../../constants";
import type { RouterWithConfig } from "../handler";
import { buildPermissionsInfoHandler, buildRequestHandler } from "../handler";
import type { FileRouter, inferErrorShape } from "../types";

export const createNuxtRouteHandler = <TRouter extends FileRouter>(
  opts: RouterWithConfig<TRouter>,
) => {
  const router = createRouter();
  const requestHandler = buildRequestHandler<TRouter, "nuxt">(opts);

  const POST = defineEventHandler(async (event) => {
    const errorFormatter =
      opts.router[Object.keys(opts.router)[0]]?._def.errorFormatter ??
      defaultErrorFormatter;

    const response = await requestHandler({
      req: {
        ...event.node.req,
        json: () => readBody(event),
        headers: getRequestHeaders(event),
      },
      res: event.node.res,
    });

    event.node.res.setHeader("x-uploadthing-version", UPLOADTHING_VERSION);

    if (response instanceof UploadThingError) {
      const formattedError = errorFormatter(
        response,
      ) as inferErrorShape<TRouter>;

      setResponseStatus(event, getStatusCodeFromError(response));

      return JSON.stringify(formattedError);
    }

    if (response.status !== 200) {
      // We messed up - this should never happen
      setResponseStatus(event, 500);

      return "An unknown error occured";
    }

    setResponseStatus(event, response.status);

    return JSON.stringify(response.body);
  });

  const getBuildPerms = buildPermissionsInfoHandler<TRouter>(opts);

  const GET = defineEventHandler((event) => {
    event.node.res.setHeader("x-uploadthing-version", UPLOADTHING_VERSION);
    return getBuildPerms();
  });

  router.post("/", POST);
  router.get("/", GET);

  // this is not a hook
  // eslint-disable-next-line react-hooks/rules-of-hooks
  return useBase("/api/uploadthing", router.handler);
};
