const ERROR_CODES = {
  BAD_REQUEST: 400,
  NOT_FOUND: 404,

  INTERNAL_SERVER_ERROR: 500,
  INTERNAL_CLIENT_ERROR: 500,
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

export class UploadThingError extends Error {
  public readonly cause?: Error;
  public readonly code: ErrorCode;
  public readonly data?: any;

  constructor(opts: {
    code: keyof typeof ERROR_CODES;
    message?: string;
    cause?: unknown;
    data?: any;
  }) {
    const message = opts.message ?? messageFromUnknown(opts.cause, opts.code);

    super(message);
    this.code = opts.code;
    // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment
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

  public static async fromResponse(response: Response) {
    const message = await response.text();
    let shape: unknown = undefined;
    try {
      shape = JSON.parse(message);
    } catch {}
    return new UploadThingError({
      message,
      code: getErrorTypeFromStatusCode(response.status),
      cause: response,
      data: shape,
    });
  }
}

export function getStatusCodeFromError(error: UploadThingError) {
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
