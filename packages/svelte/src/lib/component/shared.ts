export function getFilesFromClipboardEvent(event: ClipboardEvent) {
  const dataTransferItems = event.clipboardData?.items;
  if (!dataTransferItems) return;

  const files = Array.from(dataTransferItems).reduce<File[]>((acc, curr) => {
    const f = curr.getAsFile();
    return f ? [...acc, f] : acc;
  }, []);

  return files;
}

export const progressWidths: Record<number, string> = {
  0: "after:w-0",
  10: "after:w-[10%]",
  20: "after:w-[20%]",
  30: "after:w-[30%]",
  40: "after:w-[40%]",
  50: "after:w-[50%]",
  60: "after:w-[60%]",
  70: "after:w-[70%]",
  80: "after:w-[80%]",
  90: "after:w-[90%]",
  100: "after:w-[100%]",
};
