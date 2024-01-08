export const ALLOWED_FILE_TYPES = [
  "image",
  "video",
  "audio",
  "pdf",
  "text",
  "blob",
] as const;

export type AllowedFileType = (typeof ALLOWED_FILE_TYPES)[number];
