import { ApiReferenceReact } from "@scalar/api-reference-react";

import "@scalar/api-reference-react/style.css";

import { useTheme } from "nextra-theme-docs";

const specUrl = "https://api.uploadthing.com/openapi-spec.json";

export function ScalarApiRef() {
  const theme = useTheme();
  const isDark = theme.resolvedTheme === "dark";

  return (
    <ApiReferenceReact
      configuration={{
        layout: "classic",
        // @ts-ignore
        searchHotKey: "", // doesn't look like it's disableable
        darkMode: isDark,
        spec: { url: specUrl },
      }}
    />
  );
}
