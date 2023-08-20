import type { UploadFileResponse } from "uploadthing/client";
import type {
  FileRouter,
  inferEndpointInput,
  inferErrorShape,
} from "uploadthing/server";
import type { UploadThingError } from "uploadthing/shared";

export type UploadthingComponentProps<TRouter extends FileRouter> = {
  [TEndpoint in keyof TRouter]: {
    endpoint: TEndpoint;

    onUploadProgress?: (progress: number) => void;
    onClientUploadComplete?: (res?: UploadFileResponse[]) => void;
    onUploadError?: (error: UploadThingError<inferErrorShape<TRouter>>) => void;
  } & (undefined extends inferEndpointInput<TRouter[TEndpoint]>
    ? // eslint-disable-next-line @typescript-eslint/ban-types
      {}
    : {
        input: inferEndpointInput<TRouter[TEndpoint]>;
      });
}[keyof TRouter];
