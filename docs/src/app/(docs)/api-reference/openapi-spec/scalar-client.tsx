"use client";

// import '@scalar/api-reference-react/style.css'
import { RefObject, useEffect, useRef, useState } from "react";
import { ApiReferenceReact } from "@scalar/api-reference-react";
import { useTheme } from "next-themes";

const specUrl = "https://api.uploadthing.com/openapi-spec.json";

const useMutationObserver = (
  ref: RefObject<HTMLElement>,
  callback: (...args: Parameters<MutationCallback>) => boolean,
  options = {
    attributes: true,
    characterData: true,
    childList: true,
    subtree: true,
  },
) => {
  useEffect(() => {
    if (ref.current) {
      const observer = new MutationObserver((args) => {
        if (callback(args, observer)) {
          observer.disconnect();
        }
      });
      observer.observe(ref.current, options);
      return () => observer.disconnect();
    }
  }, [callback, options]);
};

export function Loader() {
  return (
    <div className="py-64">
      <div className="flex items-center justify-center space-x-2">
        <div className="h-5 w-5 animate-bounce rounded-full bg-red-400 [animation-delay:-0.3s]"></div>
        <div className="h-5 w-5 animate-bounce rounded-full bg-red-400 [animation-delay:-0.13s]"></div>
        <div className="h-5 w-5 animate-bounce rounded-full bg-red-400"></div>
      </div>
    </div>
  );
}

export default function ScalarApiRef() {
  const theme = useTheme();
  const isDark = theme.resolvedTheme === "dark";

  const [loaded, setLoaded] = useState(false);

  const ref = useRef<HTMLDivElement>(null);
  useMutationObserver(ref, (args) => {
    if (
      args.filter(
        (a) =>
          a.type === "attributes" &&
          a.target instanceof Element &&
          a.target.classList.contains("scalar-app") &&
          a.target.classList.contains("references-layout"),
      ).length > 0
    ) {
      setLoaded(true);
      return true;
    }

    return false;
  });

  return (
    <div ref={ref}>
      {!loaded && <Loader />}
      <ApiReferenceReact
        configuration={{
          hideModels: true,
          layout: "classic",
          searchHotKey: "" as any, // doesn't look like it's disableable
          darkMode: isDark,
          // customCss: `
          //   .dark-mode {
          //     --scalar-background-1: hsla(241.9, 6.3926%, 10.038%) !important;
          //   }
          // `,
          spec: { url: specUrl },
        }}
      />
    </div>
  );
}
