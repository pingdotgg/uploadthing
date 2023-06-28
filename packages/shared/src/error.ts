const ERROR_CODES = {
  INTERNAL_SERVER_ERROR: 500,
  INTERNAL_CLIENT_ERROR: 500,
  FAILED_TO_SIGN: 500,
  FAILED_TO_UPLOAD: 500,
  BAD_REQUEST: 400,
  MISSING_ENV: 500,
  FILE_LIMIT_EXCEEDED: 500,
};

type ErrorCode = keyof typeof ERROR_CODES;

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

  public static async fromResponse(response: Response) {
    const message = await response.text();
    return new UploadThingError({
      message,
      code: getErrorCodeFromStatusCode(response.status),
      cause: response,
    });
  }
}

export function getStatusCodeFromError(error: UploadThingError) {
  return ERROR_CODES[error.code] ?? 500;
}

function getErrorCodeFromStatusCode(statusCode: number): ErrorCode {
  for (const [code, status] of Object.entries(ERROR_CODES)) {
    if (status === statusCode) {
      return code as ErrorCode;
    }
  }
  return "INTERNAL_SERVER_ERROR";
}
