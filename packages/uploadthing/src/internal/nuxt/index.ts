import {
  createRouter,
  defineEventHandler,
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
        // Removing original headers property
        ...(() => {
          const { headers: _, ...rest } = event.node.req;

          return rest;
        })(),
        json: () => readBody(event),
        // Building custom headers property that will comply with type definitions
        // of the `requestHandler` function
        headers: {
          get(name) {
            const result = event.node.req.headers[name];

            if (!result) {
              return null;
            }

            if (Array.isArray(result)) {
              return result.join(',');
            }

            return result;
          },
        }
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
