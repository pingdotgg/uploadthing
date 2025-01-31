import { Links, Meta, Outlet, Scripts, ScrollRestoration } from "react-router";

import "./tailwind.css";
import "@uploadthing/react/styles.css";

import { ClerkProvider } from "@clerk/react-router";
import { rootAuthLoader } from "@clerk/react-router/ssr.server";

import type { Route } from "./+types/root";

export async function loader(args: Route.LoaderArgs) {
  return rootAuthLoader(args);
}

export default function App({ loaderData }: Route.ComponentProps) {
  return (
    <ClerkProvider
      loaderData={loaderData}
      signUpFallbackRedirectUrl="/"
      signInFallbackRedirectUrl="/"
    >
      <html lang="en">
        <head>
          <meta charSet="utf-8" />
          <meta name="viewport" content="width=device-width, initial-scale=1" />
          <Meta />
          <Links />
        </head>
        <body className="m-0 flex min-h-screen min-w-[320px] items-center">
          <Outlet />

          <ScrollRestoration />
          <Scripts />
        </body>
      </html>
    </ClerkProvider>
  );
}
