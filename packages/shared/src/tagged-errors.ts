import * as Data from "effect/Data";
import * as Predicate from "effect/Predicate";

export class InvalidRouteConfigError extends Data.Error<{
  reason: string;
}> {
  readonly _tag = "InvalidRouteConfig";
  readonly name = "InvalidRouteConfigError";
  constructor(type: string, field?: string) {
    const reason = field
      ? `Expected route config to have a ${field} for key ${type} but none was found.`
      : `Encountered an invalid route config during backfilling. ${type} was not found.`;
    super({ reason });
  }
}

export class UnknownFileTypeError extends Data.Error<{
  reason: string;
}> {
  readonly _tag = "UnknownFileType";
  readonly name = "UnknownFileTypeError";
  constructor(fileName: string) {
    const reason = `Could not determine type for ${fileName}`;
    super({ reason });
  }
}

export class InvalidFileTypeError extends Data.Error<{
  reason: string;
}> {
  readonly _tag = "InvalidFileType";
  readonly name = "InvalidFileTypeError";
  constructor(fileType: string, fileName: string) {
    const reason = `File type ${fileType} not allowed for ${fileName}`;
    super({ reason });
  }
}

export class InvalidFileSizeError extends Data.Error<{
  reason: string;
}> {
  readonly _tag = "InvalidFileSize";
  readonly name = "InvalidFileSizeError";
  constructor(fileSize: string) {
    const reason = `Invalid file size: ${fileSize}`;
    super({ reason });
  }
}

export class InvalidURLError extends Data.Error<{
  reason: string;
}> {
  readonly _tag = "InvalidURL";
  readonly name = "InvalidURLError";
  constructor(attemptedUrl: string) {
    super({ reason: `Failed to parse '${attemptedUrl}' as a URL.` });
  }
}

export class RetryError extends Data.Error {
  readonly _tag = "RetryError";
  readonly name = "RetryError";
}

/**
 * @internal
 */
export const getRequestUrl = (input: RequestInfo | URL) => {
  if (input instanceof Request) {
    return input.url;
  }
  return input.toString();
};

export class FetchError extends Data.Error<{
  readonly input: {
    url: string;
    method: string | undefined;
    body: unknown;
    headers: Record<string, string>;
  };
  readonly error: unknown;
}> {
  readonly _tag = "FetchError";
  readonly name = "FetchError";
}

export class InvalidJsonError extends Data.Error<{
  readonly input: unknown;
  readonly error: unknown;
}> {
  readonly _tag = "InvalidJsonError";
  readonly name = "InvalidJsonError";
}

export class BadRequestError<T = unknown> extends Data.Error<{
  readonly message: string;
  readonly status: number;
  readonly json: T;
}> {
  readonly _tag = "BadRequestError";
  readonly name = "BadRequestError";
  getMessage() {
    if (Predicate.isRecord(this.json)) {
      if (typeof this.json.message === "string") return this.json.message;
    }
    return this.message;
  }
}
