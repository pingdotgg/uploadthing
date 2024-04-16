import { useState } from "react";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { httpBatchLink, loggerLink } from "@trpc/client";
import { createTRPCReact } from "@trpc/react-query";
import { inferRouterOutputs } from "@trpc/server";
import Constants from "expo-constants";

import type { TRPCRouter } from "../app/api/trpc/[trpc]+api";

/**
 * A set of typesafe hooks for consuming your API.
 */
export const api = createTRPCReact<TRPCRouter>();

export type RouterOutputs = inferRouterOutputs<TRPCRouter>;

/**
 * Extend this function when going to production by
 * setting the baseUrl to your production API URL.
 */
const resolveUrl = () => {
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
      process.env.EXPO_PUBLIC_SERVER_ORIGIN ?? `http://${debuggerHost}`,
    );
  } catch (e) {
    throw new Error(
      `Failed to resolve URL from ${process.env.EXPO_PUBLIC_SERVER_ORIGIN} or ${debuggerHost}`,
    );
  }
};

/**
 * A wrapper for your app that provides the TRPC context.
 * Use only in _app.tsx
 */
export function TRPCProvider(props: { children: React.ReactNode }) {
  const [queryClient] = useState(() => new QueryClient());
  const [trpcClient] = useState(() =>
    api.createClient({
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
  );

  return (
    <api.Provider client={trpcClient} queryClient={queryClient}>
      <QueryClientProvider client={queryClient}>
        {props.children}
      </QueryClientProvider>
    </api.Provider>
  );
}
