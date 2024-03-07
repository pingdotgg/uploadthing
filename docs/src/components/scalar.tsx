import { ApiReference as VueComponent } from "@scalar/api-reference";
import { useTheme } from "nextra-theme-docs";
import { applyVueInReact } from "veaury";

const ApiReference = applyVueInReact(VueComponent);

const specUrl = "https://uploadthing.com/api/openapi-spec.json";

export function ScalarApiRef() {
  const theme = useTheme();
  const isDark = theme.resolvedTheme === "dark";

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
