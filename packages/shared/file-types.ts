import * as z from "zod";

import { mimeDB } from "@uploadthing/mime-types";

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

export const MimeTypeZod = zodEnumFromObjKeys(mimeDB);

export const InternalFileTypeValidator = z.enum(ALLOWED_FILE_TYPES);
export const InternalMimeTypeValidator = MimeTypeZod;

export const CombinedTypeValidator = z.union([
  InternalFileTypeValidator,
  InternalMimeTypeValidator,
]);
