const ERROR_CODES = {
  INTERNAL_SERVER_ERROR: 500,
  FAILED_TO_SIGN: 500,
  FAILED_TO_UPLOAD: 500,
  BAD_REQUEST: 400,
  MISSING_ENV: 500,
  FILE_LIMIT_EXCEEDED: 500,
};

function messageFromUnknown(cause: unknown) {
  if (typeof cause === "string") {
    return cause;
  }
  if (cause instanceof Error) {
    return cause.message;
  }
  if (cause && typeof cause === "object" && "message" in cause) {
    return cause.message;
  }
}

export class UploadThingError extends Error {
  public readonly cause?: Error;
  public readonly code;

  constructor(opts: {
    code: keyof typeof ERROR_CODES;
    message?: string;
    cause?: unknown;
  }) {
    const message = opts.message ?? messageFromUnknown(opts.cause) ?? opts.code;

    // @ts-expect-error https://github.com/tc39/proposal-error-cause
    super(message, { cause: opts.cause });

    this.code = opts.code;
  }
}

export function getStatusCodeFromError(error: UploadThingError) {
  return ERROR_CODES[error.code] ?? 500;
}
