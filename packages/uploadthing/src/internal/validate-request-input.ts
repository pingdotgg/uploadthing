/**
 * The `import type * as _MAKE_TS_AWARE_1 from` are imported to make TypeScript aware of the types.
 * It's having a hard time resolving deeply nested stuff from transitive dependencies.
 * You'll notice if you need to add more imports if you get build errors like:
 * `The type of X cannot be inferred without a reference to <MODULE>`
 */
import type * as S from "@effect/schema/Schema";
import { Effect, Unify } from "effect";
import { TaggedError } from "effect/Data";
import type * as _MAKE_TS_AWARE_1 from "effect/Types";

import type {
  ExpandedRouteConfig,
  FileRouterInputKey,
  FileSize,
} from "@uploadthing/shared";
import {
  bytesToFileSize,
  fetchContext,
  fileSizeToBytes,
  getTypeFromFileName,
  InvalidRouteConfigError,
  objectKeys,
  UploadThingError,
} from "@uploadthing/shared";

import { getApiKey } from "./get-api-key";
import { logger } from "./logger";
import type { UploadActionPayload } from "./shared-schemas";
import type { ActionType, FileRouter, RouterWithConfig } from "./types";
import { VALID_ACTION_TYPES } from "./types";

class FileSizeMismatch extends TaggedError("FileSizeMismatch")<{
  reason: string;
}> {
  constructor(type: FileRouterInputKey, max: FileSize, actual: number) {
    const reason = `You uploaded a ${type} file that was ${bytesToFileSize(actual)}, but the limit for that type is ${max}`;
    super({ reason });
  }
}

class FileCountMismatch extends TaggedError("FileCountMismatch")<{
  reason: string;
}> {
  constructor(type: FileRouterInputKey, max: number, actual: number) {
    const reason = `You uploaded ${actual} files of type '${type}', but the limit for that type is ${max}`;
    super({ reason });
  }
}

// Verify that the uploaded files doesn't violate the route config,
// e.g. uploading more videos than allowed, or a file that is larger than allowed.
// This is double-checked on infra side, but we want to fail early to avoid network latency.
export const assertFilesMeetConfig = Unify.unify(
  (
    files: S.Schema.To<typeof UploadActionPayload>["files"],
    routeConfig: ExpandedRouteConfig,
  ) => {
    const counts: Record<string, number> = {};

    for (const file of files) {
      const type = getTypeFromFileName(file.name, objectKeys(routeConfig));
      counts[type] = (counts[type] ?? 0) + 1;

      const sizeLimit = routeConfig[type]?.maxFileSize;
      if (!sizeLimit) {
        return Effect.fail(new InvalidRouteConfigError(type, "maxFileSize"));
      }
      const sizeLimitBytes = fileSizeToBytes(sizeLimit);

      if (file.size > sizeLimitBytes) {
        return Effect.fail(new FileSizeMismatch(type, sizeLimit, file.size));
      }
    }

    for (const _key in counts) {
      const key = _key as FileRouterInputKey;
      const count = counts[key];
      const limit = routeConfig[key]?.maxFileCount;

      if (!limit) {
        return Effect.fail(new InvalidRouteConfigError(key, "maxFileCount"));
      }
      if (count > limit) {
        return Effect.fail(new FileCountMismatch(key, limit, count));
      }
    }

    return Effect.succeed(null);
  },
);

export const parseAndValidateRequest = (opts: {
  req: Request;
  opts: RouterWithConfig<FileRouter>;
  adapter: string;
}) =>
  Effect.gen(function* ($) {
    // Get inputs from query and params
    const url = new URL(opts.req.url);
    const headers = opts.req.headers;
    const params = url.searchParams;
    const uploadthingHook = headers.get("uploadthing-hook") ?? undefined;
    const slug = params.get("slug") ?? undefined;
    const actionType = (params.get("actionType") as ActionType) ?? undefined;
    const utFrontendPackage = headers.get("x-uploadthing-package") ?? "unknown";

    if (!slug) {
      logger.error("No slug provided in params:", params);
      return yield* $(
        Effect.fail(
          new UploadThingError({
            code: "BAD_REQUEST",
            message: "No slug provided in params",
          }),
        ),
      );
    }

    if (slug && typeof slug !== "string") {
      const msg = `Expected slug to be of type 'string', got '${typeof slug}'`;
      logger.error(msg);
      return yield* $(
        Effect.fail(
          new UploadThingError({
            code: "BAD_REQUEST",
            message: "`slug` must be a string",
            cause: msg,
          }),
        ),
      );
    }
    if (actionType && typeof actionType !== "string") {
      const msg = `Expected actionType to be of type 'string', got '${typeof actionType}'`;
      logger.error(msg);
      return yield* $(
        Effect.fail(
          new UploadThingError({
            code: "BAD_REQUEST",
            message: "`actionType` must be a string",
            cause: msg,
          }),
        ),
      );
    }
    if (uploadthingHook && typeof uploadthingHook !== "string") {
      const msg = `Expected uploadthingHook to be of type 'string', got '${typeof uploadthingHook}'`;
      return yield* $(
        Effect.fail(
          new UploadThingError({
            code: "BAD_REQUEST",
            message: "`uploadthingHook` must be a string",
            cause: msg,
          }),
        ),
      );
    }

    const apiKey = getApiKey(opts.opts.config?.uploadthingSecret);
    if (!apiKey) {
      const msg = `No secret provided, please set UPLOADTHING_SECRET in your env file or in the config`;
      logger.error(msg);
      return yield* $(
        Effect.fail(
          new UploadThingError({
            code: "MISSING_ENV",
            message: `No secret provided`,
            cause: msg,
          }),
        ),
      );
    }

    if (!apiKey.startsWith("sk_")) {
      const msg = `Invalid secret provided, UPLOADTHING_SECRET must start with 'sk_'`;
      logger.error(msg);
      return yield* $(
        Effect.fail(
          new UploadThingError({
            code: "MISSING_ENV",
            message: "Invalid API key. API keys must start with 'sk_'.",
            cause: msg,
          }),
        ),
      );
    }

    if (utFrontendPackage && typeof utFrontendPackage !== "string") {
      const msg = `Expected x-uploadthing-package to be of type 'string', got '${typeof utFrontendPackage}'`;
      logger.error(msg);
      return yield* $(
        Effect.fail(
          new UploadThingError({
            code: "BAD_REQUEST",
            message:
              "`x-uploadthing-package` must be a string. eg. '@uploadthing/react'",
            cause: msg,
          }),
        ),
      );
    }

    const uploadable = opts.opts.router[slug];
    if (!uploadable) {
      const msg = `No file route found for slug ${slug}`;
      logger.error(msg);
      return yield* $(
        Effect.fail(
          new UploadThingError({
            code: "NOT_FOUND",
            message: msg,
          }),
        ),
      );
    }

    if (
      uploadthingHook !== "callback" && // TODO: Maybe just send callback as actionType? Or actionType as header?
      (!actionType || !VALID_ACTION_TYPES.includes(actionType))
    ) {
      // This would either be someone spamming or the AWS webhook
      const msg = `Expected ${VALID_ACTION_TYPES.map((x) => `"${x}"`)
        .join(", ")
        .replace(/,(?!.*,)/, " or")} but got "${actionType}"`;
      logger.error("Invalid action type.", msg);
      return yield* $(
        Effect.fail(
          new UploadThingError({
            code: "BAD_REQUEST",
            cause: `Invalid action type ${actionType}`,
            message: msg,
          }),
        ),
      );
    }

    logger.debug("All request input is valid", {
      slug,
      actionType,
      uploadthingHook,
    });

    // FIXME: This should probably provide the full context at once instead of
    // partially in the `runRequestHandlerAsync` and partially in here...
    // Ref: https://discord.com/channels/@me/1201977154577891369/1207441839972548669
    const contextValue = yield* $(fetchContext);
    contextValue.baseHeaders["x-uploadthing-api-key"] = apiKey;
    contextValue.baseHeaders["x-uploadthing-fe-package"] = utFrontendPackage;
    contextValue.baseHeaders["x-uploadthing-be-adapter"] = opts.adapter;

    return {
      slug,
      uploadable,
      hook: uploadthingHook,
      action: actionType,
    };
  });
