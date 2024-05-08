import { TaggedError } from "effect/Data";

import { isObject } from "./utils";

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

/**
 * @internal
 */
export const getRequestUrl = (input: RequestInfo | URL) => {
  if (input instanceof Request) {
    return input.url;
  }
  return input.toString();
};

export class FetchError extends TaggedError("FetchError")<{
  readonly input: {
    url: string;
    method: string | undefined;
    body: unknown;
    headers: Record<string, string>;
  };
  readonly error: unknown;
}> {}

export class InvalidJsonError extends TaggedError("InvalidJsonError")<{
  readonly input: unknown;
  readonly error: unknown;
}> {}

export class BadRequestError<T = unknown> extends TaggedError(
  "BadRequestError",
)<{
  readonly message: string;
  readonly status: number;
  readonly json: T;
}> {
  getMessage() {
    if (isObject(this.json)) {
      if (typeof this.json.message === "string") return this.json.message;
    }
    return this.message;
  }
}
