import type {
  Json,
  UploadRouteConfigFromUser,
  UploadThingError,
} from "@uploadthing/shared";

import { defaultErrorFormatter } from "./error-formatter";
import type {
  AnyParams,
  AnyRuntime,
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
  TRuntime extends AnyRuntime = "web",
  TErrorShape extends Json = { message: string },
> = (input: UploadRouteConfigFromUser) => UploadBuilder<{
  _input: UnsetMarker;
  _metadata: UnsetMarker;
  _runtime: TRuntime;
  _errorShape: TErrorShape;
  _errorFn: UnsetMarker;
}>;

export type CreateBuilderOptions<TErrorShape extends Json> = {
  errorFormatter: (err: UploadThingError) => TErrorShape;
};

export function createBuilder<
  TRuntime extends AnyRuntime = "web",
  TErrorShape extends Json = { message: string },
>(opts?: CreateBuilderOptions<TErrorShape>): InOut<TRuntime, TErrorShape> {
  return (input: UploadRouteConfigFromUser) => {
    return internalCreateBuilder<TRuntime, TErrorShape>({
      routerConfig: input,
      ...opts,
    });
  };
}
