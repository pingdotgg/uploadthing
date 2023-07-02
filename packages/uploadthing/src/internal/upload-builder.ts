import type { FileRouterInputConfig } from "@uploadthing/shared";

import type {
  AnyParams,
  AnyRuntime,
  FileRouter,
  UnsetMarker,
  UploadBuilder,
  UploadBuilderDef,
  Uploader,
} from "./types";

function internalCreateBuilder<TRuntime extends AnyRuntime = "web">(
  initDef: Partial<UploadBuilderDef<any>> = {},
): UploadBuilder<{
  _input: UnsetMarker;
  _metadata: UnsetMarker;
  _runtime: TRuntime;
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

type InOut<TRuntime extends AnyRuntime = "web"> = {
  (input: FileRouterInputConfig): UploadBuilder<{
    _input: UnsetMarker;
    _metadata: UnsetMarker;
    _runtime: TRuntime;
  }>;
  router: <T extends FileRouter>(router: T) => T;
};

export function createBuilder<
  TRuntime extends AnyRuntime = "web",
>(): InOut<TRuntime> {
  const handler = (input: FileRouterInputConfig) => {
    return internalCreateBuilder<TRuntime>({ routerConfig: input });
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
  }) as InOut<TRuntime>;
}
