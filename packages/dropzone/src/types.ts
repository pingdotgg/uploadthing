import type { ExpandedRouteConfig, FileWithState } from "@uploadthing/shared";

export type AcceptProp = Record<string, string[]>;

export type DropzoneOptions = {
  routeConfig: ExpandedRouteConfig | undefined;
  minSize?: number;
  disabled?: boolean | undefined;
  onDrop: (acceptedFiles: FileWithState[]) => void;
};

export type DropzoneState = {
  isFocused: boolean;
  isDragActive: boolean;
  isDragAccept: boolean;
  isDragReject: boolean;
  isFileDialogActive: boolean;
  acceptedFiles: FileWithState[];
};
