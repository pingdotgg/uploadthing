import type { UploadThingError } from "@uploadthing/shared/error";
import type { ExpandedRouteConfig } from "@uploadthing/shared/types";
import type { UploadFileResponse } from "uploadthing/client";
import type {
  FileRouter,
  inferEndpointInput,
  inferEndpointOutput,
  inferErrorShape,
} from "uploadthing/server";

export type UploadthingComponentProps<
  TRouter extends FileRouter,
  TEndpoint extends keyof TRouter,
> = {
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

  onUploadProgress?: (progress: number) => void;
  onUploadBegin?: (fileName: string) => void;
  onBeforeUploadBegin?: (files: File[]) => File[];
  onClientUploadComplete?: (
    res: UploadFileResponse<inferEndpointOutput<TRouter[TEndpoint]>>[],
  ) => void;
  onUploadError?: (error: UploadThingError<inferErrorShape<TRouter>>) => void;
} & (undefined extends inferEndpointInput<TRouter[TEndpoint]>
  ? // eslint-disable-next-line @typescript-eslint/ban-types
    {}
  : {
      input: inferEndpointInput<TRouter[TEndpoint]>;
    });

export type EndpointMetadata = {
  slug: string;
  config: ExpandedRouteConfig;
}[];
