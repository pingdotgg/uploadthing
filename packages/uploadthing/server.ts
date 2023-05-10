import { createBuilder } from "./src/upload-builder";
export * from "./src/types";
import type { AnyRuntime } from "./src/types";

export const createFilething = <TRuntime extends AnyRuntime = "app">() =>
  createBuilder<TRuntime>();
