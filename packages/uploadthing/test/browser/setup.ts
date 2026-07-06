/**
 * Vitest browser mode defines `setImmediate` on `globalThis` with an
 * `undefined` value. Effect's scheduler feature-detects `setImmediate` with an
 * `in` check, so the broken stub makes every scheduled task die with
 * `TypeError: globalThis.setImmediate is not a function`. Remove the stub so
 * Effect falls back to `setTimeout` like it does in real browsers.
 * This must run before `effect` is imported.
 */
if (
  "setImmediate" in globalThis &&
  typeof globalThis.setImmediate !== "function"
) {
  delete (globalThis as Record<string, any>).setImmediate;
}
