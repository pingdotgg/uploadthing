
import type { FileRouter } from "../types";
import type { RouterWithConfig } from "../handler";
import { UPLOADTHING_VERSION } from "../../constants";
import {
    createRouter,
    defineEventHandler,
    useBase,
    readBody,
    setResponseStatus,
    getQuery,
} from 'h3'
import {
    buildPermissionsInfoHandler,
    buildRequestHandler,
} from "../handler";

export const createNuxtRouteHandler = <TRouter extends FileRouter>(
    opts: RouterWithConfig<TRouter>,
) => {
    const router = createRouter()
    const requestHandler = buildRequestHandler<TRouter, "nuxt">(opts);

    const POST = defineEventHandler(
        async (event) => {
            const params = getQuery(event) as {
                slug?: string;
                actionType?: string;
            };
            const uploadthingHook = event.node.req.headers['uploadthing-hook'] ?? undefined;
            const slug = params.slug ?? undefined;
            const actionType = params.actionType ?? undefined;

            event.node.res

            const response = await requestHandler({
                uploadthingHook: Array.isArray(uploadthingHook) ? uploadthingHook[0] : uploadthingHook,
                slug,
                actionType,
                req: {
                    ...event.node.req,
                    json: () => readBody(event),
                },
                res: event.node.res,
            });

            setResponseStatus(event, response.status)

            event.node.res.setHeader('x-uploadthing-version', UPLOADTHING_VERSION)

            if (response.status === 200) {
                return response.body
            }

            return response.message ?? "Unable to upload file."
        }
    )

    const getBuildPerms = buildPermissionsInfoHandler<TRouter>(opts);

    const GET = defineEventHandler(
        (event) => {
            event.node.res.setHeader('x-uploadthing-version', UPLOADTHING_VERSION)
            return getBuildPerms()
        }
    )

    router.post('/', POST)
    router.get('/', GET)

    return useBase('/api/uploadthing', router.handler)
}