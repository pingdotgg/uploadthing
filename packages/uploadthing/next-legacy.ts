export { createNextPageApiHandler } from "./src/next/core/page";
export type { FileRouter } from "./src/types";

import { createBuilder } from "./src/upload-builder";
export const createFilething = () => createBuilder<"pages">();
