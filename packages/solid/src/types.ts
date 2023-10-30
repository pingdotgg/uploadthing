import type { UploadFileResponse } from "uploadthing/client";
import type {
  FileRouter,
  inferEndpointInput,
  inferEndpointOutput,
} from "uploadthing/server";

export type UploadthingComponentProps<TRouter extends FileRouter> = {
  [TEndpoint in keyof TRouter]: {
    endpoint: TEndpoint;

    onUploadProgress?: (progress: number) => void;
    onClientUploadComplete?: (
      res: UploadFileResponse<inferEndpointOutput<TRouter[TEndpoint]>>[],
    ) => void;
    onUploadError?: (error: Error) => void;
    onUploadBegin?: (fileName: string) => void;
    url?: string;
    multiple?: boolean;
  } & (undefined extends inferEndpointInput<TRouter[TEndpoint]>
    ? // eslint-disable-next-line @typescript-eslint/ban-types
      {}
    : {
        input: inferEndpointInput<TRouter[TEndpoint]>;
      });
}[keyof TRouter];
