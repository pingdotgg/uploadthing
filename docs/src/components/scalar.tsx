import { useEffect } from "react";
import { ApiReference as VueComponent } from "@scalar/api-reference";
import { applyVueInReact } from "veaury";

const ApiReference = applyVueInReact(VueComponent);

const specUrl =
  "https://uploadthing-git-swagger-pinglabs.vercel.app/openapi.json";

export function ScalarApiRef() {
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
        spec: { url: specUrl },
      }}
    />
  );
}
