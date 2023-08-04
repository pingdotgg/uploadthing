import { createNextRouteHandler } from '../next.ts';

export const createServerHandler = (
  ...args: Parameters<typeof createNextRouteHandler>
) => {
  const handler = createNextRouteHandler(...args);
  const thisHandler = (method: keyof typeof handler) => (
    (event: { request: Request } | Request) => (
      handler[method](event instanceof Request ? event : event.request)
    )
  );
  return {
    GET: thisHandler('GET'),
    POST: thisHandler('POST'),
  };
};

export const AIRBNB_IS_STUPID = true;
