import type { ErrorCode } from "./utils";

export type AcceptProp = Record<string, string[]>;
export type { FileWithPath } from "file-selector";

export type DropEvent =
  | React.DragEvent<HTMLElement>
  | React.ChangeEvent<HTMLInputElement>
  | DragEvent
  | Event;

export type FileError = {
  message: string;
  // eslint-disable-next-line @typescript-eslint/ban-types
  code: ErrorCode | (string & {});
};
export interface FileRejection {
  file: File;
  errors: FileError[];
}

export type DropzoneOptions = Pick<
  React.HTMLProps<HTMLElement>,
  "multiple" | "onDragEnter" | "onDragOver" | "onDragLeave"
> & {
  accept?: AcceptProp;
  minSize?: number;
  maxSize?: number;
  maxFiles?: number;
  preventDropOnDocument?: boolean;
  noClick?: boolean;
  noKeyboard?: boolean;
  noDrag?: boolean;
  noDragEventsBubbling?: boolean;
  disabled?: boolean;
  onDrop?: <T extends File>(
    acceptedFiles: T[],
    fileRejections: FileRejection[],
    event: DropEvent,
  ) => void;
  onDropAccepted?: <T extends File>(files: T[], event: DropEvent) => void;
  onDropRejected?: (fileRejections: FileRejection[], event: DropEvent) => void;
  getFilesFromEvent?: (
    event: DropEvent,
  ) => Promise<(File | DataTransferItem)[]>;
  onFileDialogCancel?: () => void;
  onFileDialogOpen?: () => void;
  onError?: (err: Error) => void;
  validator?: <T extends File>(file: T) => FileError | FileError[] | null;
  useFsAccessApi?: boolean;
  autoFocus?: boolean;
};

export type DropzoneState = {
  isFocused: boolean;
  isDragActive: boolean;
  isDragAccept: boolean;
  isDragReject: boolean;
  isFileDialogActive: boolean;
  acceptedFiles: File[];
  fileRejections: FileRejection[];
  rootRef: React.RefObject<HTMLElement>;
  inputRef: React.RefObject<HTMLInputElement>;
};

export type DropzoneMethods = {
  getRootProps: <T extends DropzoneRootProps>(props?: T) => T;
  getInputProps: <T extends DropzoneInputProps>(props?: T) => T;
  open: null | (() => void);
};

export interface DropzoneRootProps extends React.HTMLAttributes<HTMLElement> {
  refKey?: string;
  [key: string]: any;
}

export interface DropzoneInputProps
  extends React.InputHTMLAttributes<HTMLInputElement> {
  refKey?: string;
}
