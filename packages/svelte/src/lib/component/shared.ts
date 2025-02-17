export function getFilesFromClipboardEvent(event: ClipboardEvent) {
  const dataTransferItems = event.clipboardData?.items;
  if (!dataTransferItems) return;

  const files = Array.from(dataTransferItems).reduce<File[]>((acc, curr) => {
    const f = curr.getAsFile();
    return f ? [...acc, f] : acc;
  }, []);

  return files;
}
