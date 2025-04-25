import { useEffect } from "react";

import { useEvent } from "./useEvent";

type PasteCallback = (event: ClipboardEvent) => void;
export const usePaste = (callback: PasteCallback) => {
  const stableCallback = useEvent(callback);

  useEffect(() => {
    const controller = new AbortController();
    window.addEventListener("paste", stableCallback, {
      signal: controller.signal,
    });
    return () => {
      controller.abort();
    };
  }, [stableCallback]);
};
