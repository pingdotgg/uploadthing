import type * as S from "@effect/schema/Schema";
import * as Context from "effect/Context";
import * as Data from "effect/Data";
import * as Effect from "effect/Effect";
import { isDevelopment } from "std-env";

import type {
  ExpandedRouteConfig,
  FileRouterInputKey,
  FileSize,
  InvalidFileSizeError,
  InvalidFileTypeError,
  UnknownFileTypeError,
} from "@uploadthing/shared";
import {
  bytesToFileSize,
  fileSizeToBytes,
  getTypeFromFileName,
  InvalidRouteConfigError,
  objectKeys,
  UploadThingError,
} from "@uploadthing/shared";

import { UPLOADTHING_VERSION } from "./constants";
import type { UploadActionPayload } from "./shared-schemas";
import type {
  ActionType,
  AnyParams,
  FileRouter,
  MiddlewareFnArgs,
  RequestHandlerInput,
  RouteHandlerConfig,
  RouteHandlerOptions,
  Uploader,
  UploadThingHook,
} from "./types";
import {
  isActionType,
  isUploadThingHook,
  VALID_ACTION_TYPES,
  VALID_UT_HOOKS,
} from "./types";
import { getToken } from "./uploadthing-token";

class FileSizeMismatch extends Data.Error<{
  reason: string;
}> {
  readonly _tag = "FileSizeMismatch";
  readonly name = "FileSizeMismatchError";
  constructor(type: FileRouterInputKey, max: FileSize, actual: number) {
    const reason = `You uploaded a ${type} file that was ${bytesToFileSize(actual)}, but the limit for that type is ${max}`;
    super({ reason });
  }
}

class FileCountMismatch extends Data.Error<{
  reason: string;
}> {
  readonly _tag = "FileCountMismatch";
  readonly name = "FileCountMismatchError";
  constructor(
    type: FileRouterInputKey,
    boundtype: "minimum" | "maximum",
    bound: number,
    actual: number,
  ) {
    const reason = `You uploaded ${actual} file(s) of type '${type}', but the ${boundtype} for that type is ${bound}`;

    super({ reason });
  }
}

// Verify that the uploaded files doesn't violate the route config,
// e.g. uploading more videos than allowed, or a file that is larger than allowed.
// This is double-checked on infra side, but we want to fail early to avoid network latency.
export const assertFilesMeetConfig = (
  files: S.Schema.Type<typeof UploadActionPayload>["files"],
  routeConfig: ExpandedRouteConfig,
): Effect.Effect<
  null,
  | UploadThingError
  | FileSizeMismatch
  | FileCountMismatch
  | InvalidRouteConfigError
  | UnknownFileTypeError
  | InvalidFileTypeError
  | InvalidFileSizeError
> =>
  Effect.gen(function* () {
    const counts: Record<string, number> = {};

    for (const file of files) {
      const type = yield* getTypeFromFileName(
        file.name,
        objectKeys(routeConfig),
      );
      counts[type] = (counts[type] ?? 0) + 1;

      const sizeLimit = routeConfig[type]?.maxFileSize;
      if (!sizeLimit) {
        return yield* new InvalidRouteConfigError(type, "maxFileSize");
      }
      const sizeLimitBytes = yield* fileSizeToBytes(sizeLimit);

      if (file.size > sizeLimitBytes) {
        return yield* new FileSizeMismatch(type, sizeLimit, file.size);
      }
    }

    for (const _key in counts) {
      const key = _key as FileRouterInputKey;
      const config = routeConfig[key];
      if (!config) return yield* new InvalidRouteConfigError(key);

      const count = counts[key];
      const min = config.minFileCount;
      const max = config.maxFileCount;

      if (min > max) {
        return yield* new UploadThingError({
          code: "BAD_REQUEST",
          message:
            "Invalid config during file count - minFileCount > maxFileCount",
          cause: `minFileCount must be less than maxFileCount for key ${key}. got: ${min} > ${max}`,
        });
      }

      if (count < min) {
        return yield* new FileCountMismatch(key, "minimum", min, count);
      }
      if (count > max) {
        return yield* new FileCountMismatch(key, "maximum", max, count);
      }
    }

    return null;
  });

type RequestInputBase = {
  req: Request;
  config: RouteHandlerConfig;
  middlewareArgs: MiddlewareFnArgs<any, any, any>;
  isDev: boolean;
  appId: string;
  apiKey: string;
  slug: string;
  adapter: string;
  uploadable: Uploader<AnyParams>;
};

type RequestInputService = RequestInputBase &
  (
    | { hook: null; action: ActionType }
    | { hook: UploadThingHook; action: null }
  );

export class RequestInput
  extends /** #__PURE__ */ Context.Tag("uploadthing/RequestInput")<
    RequestInput,
    RequestInputService
  >() {}

export const parseAndValidateRequest = (
  input: RequestHandlerInput<MiddlewareFnArgs<any, any, any>>,
  opts: RouteHandlerOptions<FileRouter>,
  adapter: string,
): Effect.Effect<RequestInputService, UploadThingError> =>
  Effect.gen(function* () {
    const req = yield* Effect.isEffect(input.req)
      ? input.req
      : Effect.succeed(input.req);
    // Get inputs from query and params
    const url = new URL(req.url);
    const headers = req.headers;
    const params = url.searchParams;
    const action = params.get("actionType");
    const slug = params.get("slug");
    const hook = headers.get("uploadthing-hook");
    const utFrontendPackage = headers.get("x-uploadthing-package") ?? "unknown";
    const clientVersion = headers.get("x-uploadthing-version");

    if (clientVersion != null && clientVersion !== UPLOADTHING_VERSION) {
      yield* Effect.logError(
        `Client version mismatch. Server version: ${UPLOADTHING_VERSION}, Client version: ${clientVersion}`,
      );
      return yield* new UploadThingError({
        code: "BAD_REQUEST",
        message: "Client version mismatch",
        cause: `Server version: ${UPLOADTHING_VERSION}, Client version: ${clientVersion}`,
      });
    }

    if (!slug) {
      yield* Effect.logError("No slug provided in params:", params);
      return yield* new UploadThingError({
        code: "BAD_REQUEST",
        message: "No slug provided in params",
      });
    }

    if (slug && typeof slug !== "string") {
      const msg = `Expected slug to be of type 'string', got '${typeof slug}'`;
      yield* Effect.logError(msg);
      return yield* new UploadThingError({
        code: "BAD_REQUEST",
        message: "`slug` must be a string",
        cause: msg,
      });
    }

    if (utFrontendPackage && typeof utFrontendPackage !== "string") {
      const msg = `Expected x-uploadthing-package to be of type 'string', got '${typeof utFrontendPackage}'`;
      yield* Effect.logError(msg);
      return yield* new UploadThingError({
        code: "BAD_REQUEST",
        message:
          "`x-uploadthing-package` must be a string. eg. '@uploadthing/react'",
        cause: msg,
      });
    }

    const uploadable = opts.router[slug];
    if (!uploadable) {
      const msg = `No file route found for slug ${slug}`;
      yield* Effect.logError(msg);
      return yield* new UploadThingError({
        code: "NOT_FOUND",
        message: msg,
      });
    }

    if (action && !isActionType(action)) {
      const msg = `Expected ${VALID_ACTION_TYPES.map((x) => `"${x}"`)
        .join(", ")
        .replace(/,(?!.*,)/, " or")} but got "${action}"`;
      yield* Effect.logError("Invalid action type", msg);
      return yield* new UploadThingError({
        code: "BAD_REQUEST",
        cause: `Invalid action type ${action}`,
        message: msg,
      });
    }

    if (hook && !isUploadThingHook(hook)) {
      const msg = `Expected ${VALID_UT_HOOKS.map((x) => `"${x}"`)
        .join(", ")
        .replace(/,(?!.*,)/, " or")} but got "${hook}"`;
      yield* Effect.logError("Invalid uploadthing hook", msg);
      return yield* new UploadThingError({
        code: "BAD_REQUEST",
        cause: `Invalid uploadthing hook ${hook}`,
        message: msg,
      });
    }

    if ((!action && !hook) || (action && hook)) {
      const msg = `Exactly one of 'actionType' or 'uploadthing-hook' must be provided`;
      yield* Effect.logError(msg);
      return yield* new UploadThingError({
        code: "BAD_REQUEST",
        message: msg,
      });
    }

    yield* Effect.logDebug("✔︎ All request input is valid");

    const { apiKey, appId, regions } = yield* getToken(
      opts.config?.uploadthingToken,
    );

    yield* Effect.logDebug("Parsed token", { apiKey, appId, regions });

    const { isDev = isDevelopment } = opts.config ?? {};
    if (isDev) yield* Effect.logInfo("UploadThing dev server is now running!");

    const base = {
      req,
      config: opts.config ?? {},
      middlewareArgs: input.middlewareArgs,
      isDev,
      appId,
      apiKey,
      slug,
      uploadable,
      adapter,
      hook: null,
      action: null,
    };

    return action
      ? { ...base, action: action as ActionType }
      : { ...base, hook: hook as UploadThingHook };
  });
