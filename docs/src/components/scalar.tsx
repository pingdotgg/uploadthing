import { useEffect } from "react";
import { ApiReferenceReact } from "@scalar/api-reference-react";
import { useTheme } from "nextra-theme-docs";

const specUrl = "https://uploadthing.com/api/openapi-spec.json";

export function ScalarApiRef() {
  const theme = useTheme();
  const isDark = theme.resolvedTheme === "dark";

  useEffect(() => {
    const toc = document.querySelector('nav[aria-label="table of contents"]');
    toc?.classList.add("hidden");
    return () => {
      toc?.classList.remove("hidden");
    };
  }, []);

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
