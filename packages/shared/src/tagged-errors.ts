import * as Micro from "effect/Micro";
import * as Predicate from "effect/Predicate";

export class InvalidRouteConfigError extends Micro.TaggedError(
  "InvalidRouteConfig",
)<{ reason: string }> {
  constructor(type: string, field?: string) {
    const reason = field
      ? `Expected route config to have a ${field} for key ${type} but none was found.`
      : `Encountered an invalid route config during backfilling. ${type} was not found.`;
    super({ reason });
  }
}

export class UnknownFileTypeError extends Micro.TaggedError("UnknownFileType")<{
  reason: string;
}> {
  constructor(fileName: string) {
    const reason = `Could not determine type for ${fileName}`;
    super({ reason });
  }
}

export class InvalidFileTypeError extends Micro.TaggedError("InvalidFileType")<{
  reason: string;
}> {
  constructor(fileType: string, fileName: string) {
    const reason = `File type ${fileType} not allowed for ${fileName}`;
    super({ reason });
  }
}

export class InvalidFileSizeError extends Micro.TaggedError("InvalidFileSize")<{
  reason: string;
}> {
  constructor(fileSize: string) {
    const reason = `Invalid file size: ${fileSize}`;
    super({ reason });
  }
}

export class InvalidURLError extends Micro.TaggedError("InvalidURL")<{
  reason: string;
}> {
  constructor(attemptedUrl: string) {
    super({ reason: `Failed to parse '${attemptedUrl}' as a URL.` });
  }
}

export class RetryError extends Micro.TaggedError("RetryError") {}

/**
 * @internal
 */
export const getRequestUrl = (input: RequestInfo | URL) => {
  if (input instanceof Request) {
    return input.url;
  }
  return input.toString();
};

export class FetchError extends Micro.TaggedError("FetchError")<{
  readonly input: {
    url: string;
    method: string | undefined;
    body: unknown;
    headers: Record<string, string>;
  };
  readonly error: unknown;
}> {}

export class InvalidJsonError extends Micro.TaggedError("InvalidJson")<{
  readonly input: unknown;
  readonly error: unknown;
}> {}

export class BadRequestError<T = unknown> extends Micro.TaggedError(
  "BadRequestError",
)<{
  readonly message: string;
  readonly status: number;
  readonly json: T;
}> {
  getMessage() {
    if (Predicate.isRecord(this.json)) {
      if (typeof this.json.message === "string") return this.json.message;
    }
    return this.message;
  }
}

export class UploadAbortedError extends Micro.TaggedError("UploadAborted") {}
