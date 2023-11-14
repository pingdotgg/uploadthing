import { Data } from "effect";

import type { Json, ResponseEsque } from "./types";
import { isObject, safeParseJSON } from "./utils";

const ERROR_CODES = {
  // Generic
  BAD_REQUEST: 400,
  NOT_FOUND: 404,
  FORBIDDEN: 403,
  INTERNAL_SERVER_ERROR: 500,
  INTERNAL_CLIENT_ERROR: 500,

  // S3 specific
  TOO_LARGE: 413,
  TOO_SMALL: 400,
  TOO_MANY_FILES: 400,
  KEY_TOO_LONG: 400,

  // UploadThing specific
  URL_GENERATION_FAILED: 500,
  UPLOAD_FAILED: 500,
  MISSING_ENV: 500,
  FILE_LIMIT_EXCEEDED: 500,
} as const;

type ErrorCode = keyof typeof ERROR_CODES;

function messageFromUnknown(cause: unknown, fallback?: string) {
  if (typeof cause === "string") {
    return cause;
  }
  if (cause instanceof Error) {
    return cause.message;
  }
  if (
    cause &&
    typeof cause === "object" &&
    "message" in cause &&
    typeof cause.message === "string"
  ) {
    return cause.message;
  }
  return fallback ?? "An unknown error occurred";
}

export class UploadThingError<
  TShape extends Json = { message: string },
  // eslint-disable-next-line @typescript-eslint/ban-types
> extends Data.TaggedError("UploadThingError")<{}> {
  public readonly cause?: Error;
  public readonly code: ErrorCode;
  public readonly data?: TShape;
  public readonly message: string;

  constructor(opts: {
    code: keyof typeof ERROR_CODES;
    message?: string;
    cause?: unknown;
    data?: TShape;
  }) {
    super();

    this.message = opts.message ?? messageFromUnknown(opts.cause, opts.code);

    this.code = opts.code;
    this.data = opts.data;

    if (opts.cause instanceof Error) {
      this.cause = opts.cause;
    } else if (opts.cause instanceof Response) {
      this.cause = new Error(
        `Response ${opts.cause.status} ${opts.cause.statusText}`,
      );
    } else if (typeof opts.cause === "string") {
      this.cause = new Error(opts.cause);
    } else {
      this.cause = undefined;
    }
  }

  public static async fromResponse(response: ResponseEsque) {
    const jsonOrError = await safeParseJSON<Json>(response);
    if (jsonOrError instanceof Error) {
      return new UploadThingError({
        message: jsonOrError.message,
        code: getErrorTypeFromStatusCode(response.status),
        cause: response,
      });
    }

    let message: string | undefined = undefined;
    if (isObject(jsonOrError)) {
      if (typeof jsonOrError.message === "string") {
        message = jsonOrError.message;
      } else if (typeof jsonOrError.error === "string") {
        message = jsonOrError.error;
      }
    }
    return new UploadThingError({
      message,
      code: getErrorTypeFromStatusCode(response.status),
      cause: response,
      data: jsonOrError,
    });
  }

  public static toObject(error: UploadThingError) {
    return {
      code: error.code,
      message: error.message,
      data: error.data,
    };
  }

  public static serialize(error: UploadThingError) {
    return JSON.stringify(UploadThingError.toObject(error));
  }
}

export function getStatusCodeFromError(error: UploadThingError<any>) {
  return ERROR_CODES[error.code] ?? 500;
}

function getErrorTypeFromStatusCode(statusCode: number): ErrorCode {
  for (const [code, status] of Object.entries(ERROR_CODES)) {
    if (status === statusCode) {
      return code as ErrorCode;
    }
  }
  return "INTERNAL_SERVER_ERROR";
}
