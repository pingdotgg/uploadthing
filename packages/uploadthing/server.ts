import { createNextRouteHandler } from "./next";
import { createBuilder } from "./src/upload-builder";
export * from "./src/types";

export const createUploadthing = () => createBuilder<"web">();
export const createServerHandler = (
  ...args: Parameters<typeof createNextRouteHandler>
) => {
  const handler = createNextRouteHandler(...args);
  const thisHandler =
    (method: keyof typeof handler) => (event: { request: Request } | Request) =>
      handler[method](event instanceof Request ? event : event.request);
  return {
    GET: thisHandler("GET"),
    POST: thisHandler("POST"),
  };
};
