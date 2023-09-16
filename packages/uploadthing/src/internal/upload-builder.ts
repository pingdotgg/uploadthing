import type {
  FileRouterInputConfig,
  Json,
  UploadThingError,
} from "@uploadthing/shared";

import { defaultErrorFormatter } from "./error-formatter";
import type {
  AnyParams,
  MiddlewareFnArgs,
  UnsetMarker,
  UploadBuilder,
  UploadBuilderDef,
  Uploader,
} from "./types";

function internalCreateBuilder<
  TMiddlewareArgs extends MiddlewareFnArgs<any, any>,
  TErrorShape extends Json = { message: string },
>(
  initDef: Partial<UploadBuilderDef<any>> = {},
): UploadBuilder<{
  _input: UnsetMarker;
  _metadata: UnsetMarker;
  _middlewareArgs: TMiddlewareArgs;
  _errorShape: TErrorShape;
  _errorFn: UnsetMarker;
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
    onUploadError: () => ({}),

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
    onUploadError(userOnUploadError) {
      return internalCreateBuilder({
        ..._def,
        onUploadError: userOnUploadError,
      }) as UploadBuilder<any>;
    },
  };
}

type InOut<
  TMiddlewareArgs extends MiddlewareFnArgs<any, any>,
  TErrorShape extends Json = { message: string },
> = (input: FileRouterInputConfig) => UploadBuilder<{
  _input: UnsetMarker;
  _metadata: UnsetMarker;
  _middlewareArgs: TMiddlewareArgs;
  _errorShape: TErrorShape;
  _errorFn: UnsetMarker;
}>;

export type CreateBuilderOptions<TErrorShape extends Json> = {
  errorFormatter: (err: UploadThingError) => TErrorShape;
};

export function createBuilder<
  TMiddlewareArgs extends MiddlewareFnArgs<any, any>,
  TErrorShape extends Json = { message: string },
>(
  opts?: CreateBuilderOptions<TErrorShape>,
): InOut<TMiddlewareArgs, TErrorShape> {
  return (input: FileRouterInputConfig) => {
    return internalCreateBuilder<TMiddlewareArgs, TErrorShape>({
      routerConfig: input,
      ...opts,
    });
  };
}
