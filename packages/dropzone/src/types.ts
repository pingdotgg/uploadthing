export type AcceptProp = Record<string, string[]>;

export type DropzoneOptions = {
  multiple?: boolean;
  accept?: AcceptProp | undefined;
  minSize?: number;
  maxSize?: number;
  maxFiles?: number;
  disabled?: boolean | undefined;
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
