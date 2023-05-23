import type {
  UnsetMarker,
  UploadBuilder,
  UploadBuilderDef,
  Uploader,
  AnyRuntime,
  FileRouterInputConfig,
} from "./types";

function internalCreateBuilder<TRuntime extends AnyRuntime = "web">(
  initDef: Partial<UploadBuilderDef<TRuntime>> = {}
): UploadBuilder<{
  _metadata: UnsetMarker;
  _runtime: TRuntime;
}> {
  const _def: UploadBuilderDef<TRuntime> = {
    fileTypes: ["image"],
    maxSize: "1MB",
    // @ts-expect-error - huh?
    middleware: () => ({}),
    ...initDef,
  };

  return {
    middleware(resolver) {
      return internalCreateBuilder({
        ..._def,
        middleware: resolver,
      }) as UploadBuilder<{ _metadata: any; _runtime: TRuntime }>;
    },
    onUploadComplete(resolver) {
      return {
        _def,
        resolver,
      } as Uploader<{ _metadata: any; _runtime: TRuntime }>;
    },
  };
}

type InOut<TRuntime extends AnyRuntime = "web"> = (
  input: FileRouterInputConfig
) => UploadBuilder<{
  _metadata: UnsetMarker;
  _runtime: TRuntime;
}>;

export function createBuilder<
  TRuntime extends AnyRuntime = "web"
>(): InOut<TRuntime> {
  return (input: FileRouterInputConfig) => {
    const _def: UploadBuilderDef<TRuntime> = {
      fileTypes: ["image"],
      maxSize: "1MB",
      // @ts-expect-error - huh?
      middleware: () => ({}),
      ...input,
    };

    return {
      middleware(resolver) {
        return internalCreateBuilder({
          ..._def,
          middleware: resolver,
        }) as UploadBuilder<{ _metadata: any; _runtime: TRuntime }>;
      },
      onUploadComplete(resolver) {
        return {
          _def,
          resolver,
        } as Uploader<{ _metadata: any; _runtime: TRuntime }>;
      },
    };
  };
}
