import { generateComponents } from "@uploadthing/react";
import { generateReactHelpers, useDropzone } from "@uploadthing/react/hooks";

import type { Router } from "./server.js";

export const helpers = generateReactHelpers<Router>({});

export const components = generateComponents<Router>({});

export const useDrop = () => {
  return useDropzone({
    onDrop: (file) => {
      console.log(file);
    },
  });
};
