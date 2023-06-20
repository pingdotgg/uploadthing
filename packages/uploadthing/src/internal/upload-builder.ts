import type { FileRouterInputConfig } from "@uploadthing/shared";

import type {
  AnyParams,
  AnyRuntime,
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

type InOut<TRuntime extends AnyRuntime = "web"> = (
  input: FileRouterInputConfig,
) => UploadBuilder<{
  _input: UnsetMarker;
  _metadata: UnsetMarker;
  _runtime: TRuntime;
}>;

export function createBuilder<
  TRuntime extends AnyRuntime = "web",
>(): InOut<TRuntime> {
  return (input: FileRouterInputConfig) => {
    return internalCreateBuilder<TRuntime>({ routerConfig: input });
  };
}
