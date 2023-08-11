import type { UploadThingError } from "@uploadthing/shared";
import type {
  FileRouter,
  inferEndpointInput,
  inferErrorShape,
} from "uploadthing/server";
import type { UploadFileResponse } from "uploadthing/client";

export type UploadthingComponentProps<TRouter extends FileRouter> = {
  [TEndpoint in keyof TRouter]: {
    endpoint: TEndpoint;

    onUploadProgress?: (progress: number) => void;
    onClientUploadComplete?: (res?: UploadFileResponse[]) => void;
    onUploadError?: (error: UploadThingError<inferErrorShape<TRouter>>) => void;
  } & (undefined extends inferEndpointInput<TRouter[TEndpoint]>
    ? {}
    : {
      input: inferEndpointInput<TRouter[TEndpoint]>;
    });
}[keyof TRouter];
