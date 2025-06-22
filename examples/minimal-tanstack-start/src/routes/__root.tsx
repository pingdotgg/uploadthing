import * as React from "react";
import * as TSR from "@tanstack/react-router";

import uploadthingCss from "@uploadthing/react/styles.css?url";

export const Route = TSR.createRootRoute({
  component: RootComponent,
  head: () => ({
    links: [{ rel: "stylesheet", href: uploadthingCss }],
  }),
});

function RootComponent() {
  return (
    <RootDocument>
      <TSR.Outlet />
    </RootDocument>
  );
}

function RootDocument({ children }: { children: React.ReactNode }) {
  return (
    <html>
      <head>
        <TSR.HeadContent />
      </head>
      <body>
        {children}
        <TSR.Scripts />
      </body>
    </html>
  );
}
