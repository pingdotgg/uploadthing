import type { UploadFileResponse } from "uploadthing/client";
import type { FileRouter, inferEndpointInput } from "uploadthing/server";

export type UploadthingComponentProps<TRouter extends FileRouter> = {
  [TEndpoint in keyof TRouter]: {
    endpoint: TEndpoint;

    onUploadProgress?: (progress: number) => void;
    onClientUploadComplete?: (res?: UploadFileResponse[]) => void;
    onUploadError?: (error: Error) => void;
    onUploadBegin?: (fileName: string) => void;
    /**
     * URL to the UploadThing API endpoint
     * @example "/api/uploadthing"
     * @example "https://www.example.com/api/uploadthing"
     *
     * If relative, host will be inferred from either the `VERCEL_URL` environment variable or `window.location.origin`
     *
     * @default (VERCEL_URL ?? window.location.origin) + "/api/uploadthing"
     */
    url?: string;
    multiple?: boolean;
  } & (undefined extends inferEndpointInput<TRouter[TEndpoint]>
    ? // eslint-disable-next-line @typescript-eslint/ban-types
      {}
    : {
        input: inferEndpointInput<TRouter[TEndpoint]>;
      });
}[keyof TRouter];
