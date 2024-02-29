// @refresh reload
import "./global.css";

import { generateUploadButton } from "@uploadthing/solid";
import { Router } from "@solidjs/router";
import { MetaProvider, Title } from "@solidjs/meta";
import { Suspense } from "solid-js";
import { FileRoutes } from "@solidjs/start";

export default function App() {
  return (
    <Router
      root={(props) => (
        <MetaProvider>
          <Title>SolidStart - Basic</Title>
          <Suspense>{props.children}</Suspense>
        </MetaProvider>
      )}
    >
      <FileRoutes />
    </Router>
  );
}
