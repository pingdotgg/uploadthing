import * as Micro from "effect/Micro";
import * as Predicate from "effect/Predicate";

export class InvalidRouteConfigError extends Micro.Error<{
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

export class UnknownFileTypeError extends Micro.Error<{
  reason: string;
}> {
  readonly _tag = "UnknownFileType";
  readonly name = "UnknownFileTypeError";
  constructor(fileName: string) {
    const reason = `Could not determine type for ${fileName}`;
    super({ reason });
  }
}

export class InvalidFileTypeError extends Micro.Error<{
  reason: string;
}> {
  readonly _tag = "InvalidFileType";
  readonly name = "InvalidFileTypeError";
  constructor(fileType: string, fileName: string) {
    const reason = `File type ${fileType} not allowed for ${fileName}`;
    super({ reason });
  }
}

export class InvalidFileSizeError extends Micro.Error<{
  reason: string;
}> {
  readonly _tag = "InvalidFileSize";
  readonly name = "InvalidFileSizeError";
  constructor(fileSize: string) {
    const reason = `Invalid file size: ${fileSize}`;
    super({ reason });
  }
}

export class InvalidURLError extends Micro.Error<{
  reason: string;
}> {
  readonly _tag = "InvalidURL";
  readonly name = "InvalidURLError";
  constructor(attemptedUrl: string) {
    super({ reason: `Failed to parse '${attemptedUrl}' as a URL.` });
  }
}

export class RetryError extends Micro.Error {
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

export class FetchError extends Micro.Error<{
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

export class InvalidJsonError extends Micro.Error<{
  readonly input: unknown;
  readonly error: unknown;
}> {
  readonly _tag = "InvalidJsonError";
  readonly name = "InvalidJsonError";
}

export class BadRequestError<T = unknown> extends Micro.Error<{
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

export class UploadAbortedError extends Micro.TaggedError("UploadAborted") {}
