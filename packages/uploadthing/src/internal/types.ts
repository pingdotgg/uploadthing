import type {
  ContentDisposition,
  FetchEsque,
  FileRouterInputKey,
  Json,
  UploadThingError,
} from "@uploadthing/shared";

import type { FileRouter, FileUploadData } from "../types";
import type { LogLevel } from "./logger";

interface UploadThingBaseResponse {
  key: string;
  fileName: string;
  fileType: FileRouterInputKey;
  fileUrl: string;
  contentDisposition: ContentDisposition;
  pollingJwt: string;
  pollingUrl: string;
}

export interface PSPResponse extends UploadThingBaseResponse {
  url: string;
  fields: Record<string, string>;
}

export interface MPUResponse extends UploadThingBaseResponse {
  urls: string[];
  uploadId: string;
  chunkSize: number;
  chunkCount: number;
}

/**
 * Returned by `/api/prepareUpload` and `/api/uploadFiles`
 */
export type PresignedURLs = (PSPResponse | MPUResponse)[];

/**
 * Valid options for the `?actionType` query param
 */
export const VALID_ACTION_TYPES = [
  "upload",
  "failure",
  "multipart-complete",
] as const;
export type ActionType = (typeof VALID_ACTION_TYPES)[number];

/**
 * Map actionType to the required payload for that action
 */
export type UTEvents = {
  upload: {
    files: FileUploadData[];
    input: Json;
  };
  failure: {
    fileKey: string;
    uploadId: string | null;
    s3Error?: string;
    fileName: string;
  };
  "multipart-complete": {
    fileKey: string;
    uploadId: string;
    etags: {
      tag: string;
      partNumber: number;
    }[];
  };
};

/**
 * Marker used to append a `customId` to the incoming file data in `.middleware()`
 * @example
 * ```ts
 * .middleware((opts) => {
 *   return {
 *     [UTFiles]: opts.files.map((file) => ({
 *       ...file,
 *       customId: generateId(),
 *     }))
 *   };
 * })
 * ```
 */
export const UTFiles = Symbol("uploadthing-custom-id-symbol");

/**
 * Different frameworks have different request and response types
 */
export type MiddlewareFnArgs<TRequest, TResponse, TEvent> = {
  req: TRequest;
  res: TResponse;
  event: TEvent;
};

export type RouteHandlerConfig = {
  logLevel?: LogLevel;
  callbackUrl?: string;
  uploadthingId?: string;
  uploadthingSecret?: string;
  /**
   * Used to determine whether to run dev hook or not
   * @default `env.NODE_ENV === "development" || env.NODE_ENV === "dev"`
   */
  isDev?: boolean;
  /**
   * Used to override the fetch implementation
   * @default `globalThis.fetch`
   */
  fetch?: FetchEsque;
};

export type RouteHandlerOptions<TRouter extends FileRouter> = {
  router: TRouter;
  config?: RouteHandlerConfig;
};

type RequestHandlerInput<TArgs extends MiddlewareFnArgs<any, any, any>> = {
  req: Request;
  middlewareArgs: TArgs;
};
type RequestHandlerOutput = Promise<
  | {
      status: number;
      body?: PresignedURLs;
      cleanup?: Promise<unknown>;
    }
  | UploadThingError
>;

export type RequestHandler<TArgs extends MiddlewareFnArgs<any, any, any>> = (
  input: RequestHandlerInput<TArgs>,
) => RequestHandlerOutput;

/**
 * Inference helpers
 */
