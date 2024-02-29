import type { UploadThingError } from "@uploadthing/shared";
import type { UploadFileResponse } from "uploadthing/client";
import type {
  FileRouter,
  inferEndpointInput,
  inferEndpointOutput,
  inferErrorShape,
} from "uploadthing/server";

export interface GenerateTypedHelpersOptions {
  /**
   * URL to the UploadThing API endpoint
   * @example "/api/uploadthing"
   * @example "https://www.example.com/api/uploadthing"
   *
   * If relative, host will be inferred from either the `VERCEL_URL` environment variable or `window.location.origin`
   *
   * @default (VERCEL_URL ?? window.location.origin) + "/api/uploadthing"
   */
  url?: string | URL;
}

export type UseUploadthingProps<
  TRouter extends FileRouter,
  TEndpoint extends keyof TRouter,
  TSkipPolling extends boolean = false,
  TServerOutput = false extends TSkipPolling
    ? inferEndpointOutput<TRouter[TEndpoint]>
    : null,
> = {
  skipPolling?: TSkipPolling | undefined;
  onClientUploadComplete?: (res: UploadFileResponse<TServerOutput>[]) => void;
  onUploadProgress?: (p: number) => void;
  onUploadError?:
    | ((e: UploadThingError<inferErrorShape<TRouter>>) => void)
    | undefined;
  onUploadBegin?: ((fileName: string) => void) | undefined;
  onBeforeUploadBegin?:
    | ((files: File[]) => Promise<File[]> | File[])
    | undefined;
};

export type UploadthingComponentProps<
  TRouter extends FileRouter,
  TEndpoint extends keyof TRouter,
  TSkipPolling extends boolean = false,
> = UseUploadthingProps<TRouter, TEndpoint, TSkipPolling> & {
  endpoint: TEndpoint;
  /**
   * URL to the UploadThing API endpoint
   * @example URL { /api/uploadthing }
   * @example URL { https://www.example.com/api/uploadthing }
   *
   * If relative, host will be inferred from either the `VERCEL_URL` environment variable or `window.location.origin`
   *
   * @default (VERCEL_URL ?? window.location.origin) + "/api/uploadthing"
   */
  url?: string | URL;
  config?: {
    mode?: "auto" | "manual";
    appendOnPaste?: boolean;
  };
} & (undefined extends inferEndpointInput<TRouter[TEndpoint]>
    ? // eslint-disable-next-line @typescript-eslint/ban-types
      {}
    : {
        input: inferEndpointInput<TRouter[TEndpoint]>;
      });
