import type { UploadThingError } from "@uploadthing/shared";
import type { UploadFileType } from "uploadthing/client";
import type {
  FileRouter,
  inferEndpointInput,
  inferErrorShape,
} from "uploadthing/server";

export type UploadthingComponentProps<TRouter extends FileRouter> = {
  [TEndpoint in keyof TRouter]: {
    endpoint: TEndpoint;

    onUploadProgress?: (progress: number) => void;
    onClientUploadComplete?: (
      res?: Awaited<ReturnType<UploadFileType<TRouter>>>,
    ) => void;
    onUploadError?: (error: UploadThingError<inferErrorShape<TRouter>>) => void;
  } & (undefined extends inferEndpointInput<TRouter[TEndpoint]>
    ? {}
    : {
        input: inferEndpointInput<TRouter[TEndpoint]>;
      });
}[keyof TRouter];
