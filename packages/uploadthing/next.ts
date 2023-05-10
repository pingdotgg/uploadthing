export { createNextRouteHandler } from "./src/next/core/approuter";
export type { FileRouter } from "./src/types";

import { createBuilder } from "./src/upload-builder";
export const createFilething = () => createBuilder<"app">();
