import type {
  FileRouterInputConfig,
  Json,
  UploadThingError,
} from "@uploadthing/shared";

import { defaultErrorFormatter } from "./error-formatter";
import type {
  AnyParams,
  AnyRuntime,
  FileRouter,
  UnsetMarker,
  UploadBuilder,
  UploadBuilderDef,
  Uploader,
} from "./types";

function internalCreateBuilder<
  TRuntime extends AnyRuntime = "web",
  TErrorShape extends Json = { message: string },
>(
  initDef: Partial<UploadBuilderDef<any>> = {},
): UploadBuilder<{
  _input: UnsetMarker;
  _metadata: UnsetMarker;
  _runtime: TRuntime;
  _errorShape: TErrorShape;
}> {
  const _def: UploadBuilderDef<AnyParams> = {
    // Default router config
    routerConfig: {
      image: {
        maxFileSize: "4MB",
      },
    },

    inputParser: { parse: () => ({}), _input: {}, _output: {} },

    middleware: () => ({}),

    errorFormatter: initDef.errorFormatter ?? defaultErrorFormatter,

    // Overload with properties passed in
    ...initDef,
  };

  return {
    input(userParser) {
      return internalCreateBuilder({
        ..._def,
        inputParser: userParser,
      }) as UploadBuilder<any>;
    },
    middleware(userMiddleware) {
      return internalCreateBuilder({
        ..._def,
        middleware: userMiddleware,
      }) as UploadBuilder<any>;
    },
    onUploadComplete(userUploadComplete) {
      return {
        _def,
        resolver: userUploadComplete,
      } as Uploader<any>;
    },
  };
}

type InOut<
  TRuntime extends AnyRuntime = "web",
  TErrorShape extends Json = { message: string },
> = {
  (input: FileRouterInputConfig): UploadBuilder<{
    _input: UnsetMarker;
    _metadata: UnsetMarker;
    _runtime: TRuntime;
    _errorShape: TErrorShape;
  }>;
  router: <T extends FileRouter>(router: T) => T;
};

export type CreateBuilderOptions<TErrorShape extends Json> = {
  errorFormatter: (err: UploadThingError) => TErrorShape;
};

export function createBuilder<
  TRuntime extends AnyRuntime = "web",
  TErrorShape extends Json = { message: string },
>(opts?: CreateBuilderOptions<TErrorShape>): InOut<TRuntime, TErrorShape> {
  const handler = (input: FileRouterInputConfig) => {
    return internalCreateBuilder<TRuntime, TErrorShape>({
      routerConfig: input,
      ...opts,
    });
  };

  return new Proxy(handler, {
    get(target, prop) {
      if (prop === "router") {
        return (router: FileRouter) => {
          return router;
        };
      }
      return target[prop as keyof typeof handler];
    },
  }) as InOut<TRuntime, TErrorShape>;
}
