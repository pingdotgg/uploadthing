import type { MimeType } from "@uploadthing/mime-types/db";

import type { AllowedFileType } from "./file-types";

/** This matches the return type from the infra */
export interface FileData {
  id: string;
  createdAt: string;

  fileKey: string | null;
  fileName: string;
  metadata: string | null;

  callbackUrl: string;
  callbackSlug: string;
}

export type UploadedFile = {
  name: string;
  key: string;
  url: string;
  size: number;
};

type PowOf2 = 1 | 2 | 4 | 8 | 16 | 32 | 64 | 128 | 256 | 512 | 1024;
export type SizeUnit = "B" | "KB" | "MB" | "GB";
export type FileSize = `${PowOf2}${SizeUnit}`;

type RouteConfig = {
  maxFileSize: FileSize;
  maxFileCount: number;
};

export type FileRouterInputKey = AllowedFileType | MimeType;

export type ExpandedRouteConfig = Partial<
  Record<FileRouterInputKey, RouteConfig>
>;

type PartialRouteConfig = Partial<
  Record<FileRouterInputKey, Partial<RouteConfig>>
>;

export type FileRouterInputConfig = FileRouterInputKey[] | PartialRouteConfig;
