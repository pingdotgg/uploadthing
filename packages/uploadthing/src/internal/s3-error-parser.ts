import type { UploadThingError } from "../shared";

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
 * This is a subset of the S3 error codes, based on what seemed most likely to
 * occur in uploadthing. For a full list of S3 error codes, see:
 * https://docs.aws.amazon.com/AmazonS3/latest/API/ErrorResponses.html
 */
const DEFAULT_ERROR_CODE = "UPLOAD_FAILED";
const s3CodeToUploadThingCode: Record<string, UploadThingError["code"]> = {
  AccessDenied: "FORBIDDEN", // 403 Forbidden
  EntityTooSmall: "TOO_SMALL", // 400 Bad Request
  EntityTooLarge: "TOO_LARGE", // 400 Bad Request
  ExpiredToken: "FORBIDDEN", // 400 Bad Request
  IncorrectNumberOfFilesInPostRequest: "TOO_MANY_FILES", // 400 Bad Request
  InternalError: "INTERNAL_SERVER_ERROR", // 500 Internal Server Error
  KeyTooLongError: "KEY_TOO_LONG", // 400 Bad Request
  MaxMessageLengthExceeded: "TOO_LARGE", // 400 Bad Request
};
