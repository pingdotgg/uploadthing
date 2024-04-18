export function isImage(filename: string) {
  const imageExtensions = ["jpg", "png", "jpeg", "webp", "gif", "svg"];
  return imageExtensions.some((ext) => filename.endsWith(ext));
}
