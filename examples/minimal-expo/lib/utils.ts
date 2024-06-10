export function isObject(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

export function isImage(filename: string) {
  const imageExtensions = ["jpg", "png", "jpeg", "webp", "gif", "svg"];
  return imageExtensions.some((ext) => filename.endsWith(ext));
}
