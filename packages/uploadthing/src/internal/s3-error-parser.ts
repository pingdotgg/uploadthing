import type { UploadThingError } from "@uploadthing/shared";

export const maybeParseResponseXML = (maybeXml: string) => {
  const codeMatch = maybeXml.match(/<Code>(.*?)<\/Code>/s);
  const messageMatch = maybeXml.match(/<Message>(.*?)<\/Message>/s);

  const code = codeMatch?.[1];
  const message = messageMatch?.[1];

  if (!code || !message) return null;

  return { code: s3CodeToUploadThingCode[code] ?? DEFAULT_ERROR_CODE, message };
};

/**
 * Map S3 error codes to UploadThing error codes
 *
 * Might be a complete list somewhere?
 */
const DEFAULT_ERROR_CODE = "UPLOAD_FAILED";
const s3CodeToUploadThingCode: Record<string, UploadThingError["code"]> = {
  EntityTooLarge: "TOO_LARGE",
};
