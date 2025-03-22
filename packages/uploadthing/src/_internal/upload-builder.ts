import type {
  FileRouterInputConfig,
  Json,
  RouteOptions,
  UploadThingError,
} from "@uploadthing/shared";

import { defaultErrorFormatter } from "./error-formatter";
import type {
  AnyBuiltUploaderTypes,
  AnyFileRoute,
  UnsetMarker,
  UploadBuilder,
} from "./types";

function internalCreateBuilder<
  TAdapterFnArgs extends Record<string, unknown>,
  TRouteOptions extends RouteOptions,
  TErrorShape extends Json = { message: string },
>(
  initDef: Partial<AnyFileRoute> = {},
): UploadBuilder<{
  _routeOptions: TRouteOptions;
  _input: { in: UnsetMarker; out: UnsetMarker };
  _metadata: UnsetMarker;
  _adapterFnArgs: TAdapterFnArgs;
  _errorShape: TErrorShape;
  _errorFn: UnsetMarker;
  _output: UnsetMarker;
}> {
  const _def: AnyFileRoute = {
    $types: {} as AnyBuiltUploaderTypes,
    // Default router config
    routerConfig: {
      image: {
        maxFileSize: "4MB",
      },
    },
    routeOptions: {
      awaitServerData: true,
    },

    inputParser: {
      parseAsync: () => Promise.resolve(undefined),
      _input: undefined,
      _output: undefined,
    },

    middleware: () => ({}),
    onUploadError: () => {
      // noop
    },
    onUploadComplete: () => undefined,

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
        ..._def,
        onUploadComplete: userUploadComplete,
      } as AnyFileRoute;
    },
    onUploadError(userOnUploadError) {
      return internalCreateBuilder({
        ..._def,
        onUploadError: userOnUploadError,
      }) as UploadBuilder<any>;
    },
  };
}

export type CreateBuilderOptions<TErrorShape extends Json> = {
  errorFormatter: (err: UploadThingError) => TErrorShape;
};

/**
 * Create a builder for your backend adapter.
 * Refer to the existing adapters for examples on how to use this function.
 * @public
 *
 * @param opts - Options for the builder
 * @returns A file route builder for making UploadThing file routes
 */
export function createBuilder<
  TAdapterFnArgs extends Record<string, unknown>,
  TErrorShape extends Json = { message: string },
>(opts?: CreateBuilderOptions<TErrorShape>) {
  return <TRouteOptions extends RouteOptions>(
    input: FileRouterInputConfig,
    config?: TRouteOptions,
  ): UploadBuilder<{
    _routeOptions: TRouteOptions;
    _input: { in: UnsetMarker; out: UnsetMarker };
    _metadata: UnsetMarker;
    _adapterFnArgs: TAdapterFnArgs;
    _errorShape: TErrorShape;
    _errorFn: UnsetMarker;
    _output: UnsetMarker;
  }> => {
    return internalCreateBuilder<TAdapterFnArgs, TRouteOptions, TErrorShape>({
      routerConfig: input,
      routeOptions: config ?? {},
      ...opts,
    });
  };
}
