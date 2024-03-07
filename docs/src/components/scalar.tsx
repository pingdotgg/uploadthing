import { useEffect } from "react";
import { ApiReference as VueComponent } from "@scalar/api-reference";
import { useTheme } from "nextra-theme-docs";
import { applyVueInReact } from "veaury";

const ApiReference = applyVueInReact(VueComponent);

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
    // @ts-ignore
    <ApiReference
      configuration={{
        layout: "classic",
        searchHotKey: "", // doesn't look like it's disableable
        darkMode: isDark,
        spec: { url: specUrl },
      }}
    />
  );
}
