import * as Micro from "effect/Micro";

import type { Json } from "./types";
import { isObject } from "./utils";

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
type UploadThingErrorOptions<T> = {
  code: keyof typeof ERROR_CODES;
  message?: string | undefined;
  cause?: unknown;
  data?: T;
};

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

export interface SerializedUploadThingError {
  code: ErrorCode;
  message: string;
  data?: Json;
}

export class UploadThingError<
  TShape extends Json = { message: string },
> extends Micro.Error<{ message: string }> {
  readonly _tag = "UploadThingError";
  readonly name = "UploadThingError";

  public readonly cause?: unknown;
  public readonly code: ErrorCode;
  public readonly data: TShape | undefined;

  constructor(initOpts: UploadThingErrorOptions<TShape> | string) {
    const opts: UploadThingErrorOptions<TShape> =
      typeof initOpts === "string"
        ? { code: "INTERNAL_SERVER_ERROR", message: initOpts }
        : initOpts;
    const message = opts.message ?? messageFromUnknown(opts.cause, opts.code);

    super({ message });
    this.code = opts.code;
    this.data = opts.data;

    if (opts.cause instanceof Error) {
      this.cause = opts.cause;
    } else if (
      isObject(opts.cause) &&
      typeof opts.cause.status === "number" &&
      typeof opts.cause.statusText === "string"
    ) {
      this.cause = new Error(
        `Response ${opts.cause.status} ${opts.cause.statusText}`,
      );
    } else if (typeof opts.cause === "string") {
      this.cause = new Error(opts.cause);
    } else {
      this.cause = opts.cause;
    }
  }

  public static toObject(error: UploadThingError): SerializedUploadThingError {
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

export function getErrorTypeFromStatusCode(statusCode: number): ErrorCode {
  for (const [code, status] of Object.entries(ERROR_CODES)) {
    if (status === statusCode) {
      return code as ErrorCode;
    }
  }
  return "INTERNAL_SERVER_ERROR";
}

export function getStatusCodeFromError(error: UploadThingError<any>) {
  return ERROR_CODES[error.code] ?? 500;
}

export const INTERNAL_DO_NOT_USE__fatalClientError = (e: Error) =>
  new UploadThingError({
    code: "INTERNAL_CLIENT_ERROR",
    message: "Something went wrong. Please report this to UploadThing.",
    cause: e,
  });
