import "../styles.css";
export * from "./useUploadThing";
export * from "./component";
import { createNextRouteHandler } from "uploadthing/next";

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
