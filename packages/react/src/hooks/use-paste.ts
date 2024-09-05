import { useEffect } from "react";

import { useEvent } from "./use-event";

type PasteCallback = (event: ClipboardEvent) => void;
export const usePaste = (callback: PasteCallback) => {
  const stableCallback = useEvent(callback);

  useEffect(() => {
    window.addEventListener("paste", stableCallback);
    return () => {
      window.removeEventListener("paste", stableCallback);
    };
  }, [stableCallback]);
};
