/**
 * @param obj {any}
 * @param opts {import("util").InspectOptions}
 * @returns {string}
 */
export const inspect = (obj, opts) =>
  JSON.stringify(obj, null, opts.depth ?? 4);
