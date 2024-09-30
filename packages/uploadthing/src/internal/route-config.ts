import type * as S from "@effect/schema/Schema";
import * as Data from "effect/Data";
import * as Effect from "effect/Effect";

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
  fillInputRouteConfig,
  getTypeFromFileName,
  InvalidRouteConfigError,
  objectKeys,
  UploadThingError,
} from "@uploadthing/shared";

import type { UploadActionPayload } from "./shared-schemas";
import type { FileRouter } from "./types";

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
        file.type,
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

export const extractRouterConfig = <TRouter extends FileRouter>(
  router: TRouter,
) =>
  Effect.forEach(objectKeys(router), (slug) =>
    Effect.map(
      fillInputRouteConfig(router[slug]._def.routerConfig),
      (config) => ({ slug, config }),
    ),
  );
