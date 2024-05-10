import { customAlphabet } from "nanoid";

export function invariant<T>(
  condition: T,
  msg?: string | (() => string),
): asserts condition {
  if (condition) return;

  const provided = typeof msg === "function" ? msg() : msg;
  const prefix = "Invariant failed";
  const value = provided ? `${prefix}: ${provided}` : prefix;
  throw new Error(value);
}

export function genId(pfx: string) {
  const nanoid = customAlphabet("0123456789abcdefghijklmnopqrstuvwxyz", 10);
  return [pfx, nanoid()].join("_");
}
