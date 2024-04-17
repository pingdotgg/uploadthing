import { RouterOutputs } from "./trpc";

export function isImage(filename: string) {
  const imageExtensions = ["jpg", "png", "jpeg", "webp", "gif", "svg"];
  return imageExtensions.some((ext) => filename.endsWith(ext));
}

/**
 * Generate a date from a file's key.
 * You'd have this from your db but since we just use UTApi i generate one here...
 * This algorithm is not even close to scientifically sound, but I just want a
 * deterministic way to generate a date from a string.
 */
export function generateDateFromString(
  item: RouterOutputs["getFiles"][number],
) {
  const numberFromItem = JSON.stringify(item)
    .split("")
    .reduce((a, b) => a + Math.pow(b.charCodeAt(0), 4), 0);
  return new Date(+new Date("2023-01-01") + numberFromItem);
}
