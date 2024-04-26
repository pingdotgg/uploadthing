import { TaggedError } from "effect/Data";

import type { Json } from "./types";

export class InvalidRouteConfigError extends TaggedError("InvalidRouteConfig")<{
  reason: string;
}> {
  constructor(type: string, field?: string) {
    const reason = field
      ? `Expected route config to have a ${field} for key ${type} but none was found.`
      : `Encountered an invalid route config during backfilling. ${type} was not found.`;
    super({ reason });
  }
}

export class UnknownFileTypeError extends TaggedError("UnknownFileType")<{
  reason: string;
}> {
  constructor(fileName: string) {
    const reason = `Could not determine type for ${fileName}`;
    super({ reason });
  }
}

export class InvalidFileTypeError extends TaggedError("InvalidFileType")<{
  reason: string;
}> {
  constructor(fileType: string, fileName: string) {
    const reason = `File type ${fileType} not allowed for ${fileName}`;
    super({ reason });
  }
}

export class InvalidFileSizeError extends TaggedError("InvalidFileSize")<{
  reason: string;
}> {
  constructor(fileSize: string) {
    const reason = `Invalid file size: ${fileSize}`;
    super({ reason });
  }
}

export class InvalidURLError extends TaggedError("InvalidURL")<{
  reason: string;
}> {
  constructor(attemptedUrl: string) {
    super({ reason: `Failed to parse '${attemptedUrl}' as a URL.` });
  }
}

export class RetryError extends TaggedError("RetryError") {}

export class FetchError extends TaggedError("FetchError")<{
  readonly input: RequestInfo | URL;
  readonly error: unknown;
  readonly data?: Json;
}> {}
