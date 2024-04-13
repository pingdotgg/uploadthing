import type { ExpandedRouteConfig } from "@uploadthing/shared";

export type AcceptProp = Record<string, string[]>;

export type DropzoneOptions = {
  routeConfig: ExpandedRouteConfig | null;
  minSize?: number;
  disabled?: boolean;
  onDrop: <T extends File>(acceptedFiles: T[]) => void;
};

export type DropzoneState = {
  isFocused: boolean;
  isDragActive: boolean;
  isDragAccept: boolean;
  isDragReject: boolean;
  isFileDialogActive: boolean;
  acceptedFiles: File[];
};
