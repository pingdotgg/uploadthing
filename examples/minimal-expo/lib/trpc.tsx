import { QueryClient } from "@tanstack/react-query";
import { createTRPCClient, httpBatchLink } from "@trpc/client";
import { inferRouterOutputs } from "@trpc/server";
import { createTRPCOptionsProxy } from "@trpc/tanstack-react-query";
import Constants from "expo-constants";

import type { TRPCRouter } from "../app/api/trpc/[trpc]+api";

export const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      // ...
    },
  },
});

/**
 * A type-safe proxy for working with the React Query client.
 */
export const trpc = createTRPCOptionsProxy<TRPCRouter>({
  client: createTRPCClient({
    links: [
      // loggerLink({
      //   enabled: (opts) =>
      //     process.env.NODE_ENV === "development" ||
      //     (opts.direction === "down" && opts.result instanceof Error),
      //   colorMode: "ansi",
      // }),
      httpBatchLink({ url: resolveUrl() }),
    ],
  }),
  queryClient,
});

export type RouterOutputs = inferRouterOutputs<TRPCRouter>;

/**
 * Extend this function when going to production by
 * setting the baseUrl to your production API URL.
 */
function resolveUrl() {
  /**
   * Gets the IP address of your host-machine. If it cannot automatically find it,
   * you'll have to manually set it. NOTE: Port 3000 should work for most but confirm
   * you don't have anything else running on it, or you'd have to change it.
   *
   * **NOTE**: This is only for development. In production, you'll want to set the
   * baseUrl to your production API URL.
   */
  const debuggerHost = Constants.expoConfig?.hostUri;

  try {
    return new URL(
      "/api/trpc",
      typeof window !== "undefined" && typeof window.location !== "undefined"
        ? window.location.origin
        : (process.env.EXPO_PUBLIC_SERVER_ORIGIN ?? `http://${debuggerHost}`),
    );
  } catch (e) {
    throw new Error(
      `Failed to resolve URL from ${process.env.EXPO_PUBLIC_SERVER_ORIGIN} or ${debuggerHost}`,
    );
  }
}
