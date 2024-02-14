import { Effect } from "effect";

import type {
  ExpandedRouteConfig,
  FileRouterInputKey,
} from "@uploadthing/shared";
import {
  fetchContext,
  getTypeFromFileName,
  objectKeys,
  UploadThingError,
} from "@uploadthing/shared";

import { getApiKey } from "./get-api-key";
import { logger } from "./logger";
import type { ActionType, FileRouter, RouterWithConfig } from "./types";
import { VALID_ACTION_TYPES } from "./types";

export const fileCountLimitHit = (
  files: readonly { name: string }[],
  routeConfig: ExpandedRouteConfig,
) => {
  const counts: Record<string, number> = {};

  files.forEach((file) => {
    const type = getTypeFromFileName(file.name, objectKeys(routeConfig));

    if (!counts[type]) {
      counts[type] = 1;
    } else {
      counts[type] += 1;
    }
  });

  for (const _key in counts) {
    const key = _key as FileRouterInputKey;
    const count = counts[key];
    const limit = routeConfig[key]?.maxFileCount;

    if (!limit) {
      logger.error(routeConfig, key);
      throw new UploadThingError({
        code: "BAD_REQUEST",
        message: "Invalid config during file count",
        cause: `Expected route config to have a maxFileCount for key ${key} but none was found.`,
      });
    }

    if (count > limit) {
      return { limitHit: true, type: key, limit, count };
    }
  }

  return { limitHit: false };
};

export const parseAndValidateRequest = (opts: {
  req: Request;
  opts: RouterWithConfig<FileRouter>;
  adapter: string;
}) => {
  return Effect.gen(function* ($) {
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
};
