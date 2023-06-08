import * as z from "zod";

import { mimeTypes } from "@uploadthing/mime-types/db";

export const ALLOWED_FILE_TYPES = [
  "image",
  "video",
  "audio",
  "pdf",
  "text",
  "blob",
] as const;

export type AllowedFileType = (typeof ALLOWED_FILE_TYPES)[number];

export function zodEnumFromObjKeys<K extends string>(
  obj: Record<K, any>,
): z.ZodEnum<[K, ...K[]]> {
  const [firstKey, ...otherKeys] = Object.keys(obj) as K[];
  return z.enum([firstKey, ...otherKeys]);
}

export const MimeTypeZod = zodEnumFromObjKeys(mimeTypes);

export const InternalFileTypeValidator = z.enum(ALLOWED_FILE_TYPES);
export const InternalMimeTypeValidator = MimeTypeZod;

export const CombinedTypeValidator = z.union([
  InternalFileTypeValidator,
  InternalMimeTypeValidator,
]);
