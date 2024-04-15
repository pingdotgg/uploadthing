/**
 * This is a forked version of the react-dropzone package, that's been minified
 * to suit UploadThing's needs and be easily portable to other frameworks than React.
 * See original source here: https://github.com/react-dropzone/react-dropzone
 * The original package is licensed under the MIT license.
 */

import type { ExpandedRouteConfig, FileWithState } from "@uploadthing/shared";
import {
  fileSizeToBytes,
  generateClientDropzoneAccept,
  generatePermittedFileTypes,
} from "@uploadthing/shared";

import type { AcceptProp, DropzoneState } from "./types";

/**
 * Copyright (c) (MIT License) 2015 Andrey Okonetchnikov
 * https://github.com/react-dropzone/attr-accept/blob/master/src/index.js
 */
function accepts(file: File, acceptedFiles: string | string[]): boolean {
  if (file && acceptedFiles) {
    const acceptedFilesArray = Array.isArray(acceptedFiles)
      ? acceptedFiles
      : acceptedFiles.split(",");
    const fileName = file.name ?? "";
    const mimeType = (file.type ?? "").toLowerCase();
    const baseMimeType = mimeType.replace(/\/.*$/, "");

    return acceptedFilesArray.some((type) => {
      const validType = type.trim().toLowerCase();
      if (validType.startsWith(".")) {
        return fileName.toLowerCase().endsWith(validType);
      } else if (validType.endsWith("/*")) {
        // This is something like a image/* mime type
        return baseMimeType === validType.replace(/\/.*$/, "");
      }
      return mimeType === validType;
    });
  }
  return true;
}

export const isPropagationStopped = (event: Event) => {
  if (typeof event.cancelBubble !== "undefined") {
    return event.cancelBubble;
  }
  return false;
};

// Firefox versions prior to 53 return a bogus MIME type for every file drag, so dragovers with
// that MIME type will always be accepted
export function isFileAccepted(file: File, accept: string | undefined) {
  if (!accept) return true;
  return file.type === "application/x-moz-file" || accepts(file, accept);
}

export function isEnterOrSpace(event: { key?: string; keyCode?: number }) {
  return (
    ("key" in event && (event.key === " " || event.key === "Enter")) ||
    ("keyCode" in event && (event.keyCode === 32 || event.keyCode === 13))
  );
}

const isDefined = <T>(v: T | null | undefined): v is T => v != null;
export function isValidSize(file: File, minSize: number, maxSize: number) {
  if (!isDefined(file.size)) return true;
  if (isDefined(minSize) && isDefined(maxSize)) {
    return file.size >= minSize && file.size <= maxSize;
  }
  if (isDefined(minSize) && file.size < minSize) return false;
  if (isDefined(maxSize) && file.size > maxSize) return false;
  return true;
}

export function isValidQuantity(
  files: File[],
  multiple: boolean,
  maxFiles: number,
) {
  if (!multiple && files.length > 1) return false;
  if (multiple && maxFiles >= 1 && files.length > maxFiles) return false;
  return true;
}

export function allFilesAccepted({
  files,
  accept,
  minSize,
  maxSize,
  multiple,
  maxFiles,
}: {
  files: File[];
  accept: string | undefined;
  minSize: number;
  maxSize: number;
  multiple: boolean;
  maxFiles: number;
}) {
  if (!isValidQuantity(files, multiple, maxFiles)) return false;

  return files.every(
    (file) =>
      isFileAccepted(file, accept) && isValidSize(file, minSize, maxSize),
  );
}

export function isEventWithFiles(event: Partial<Event>) {
  if (!("dataTransfer" in event && event.dataTransfer !== null)) {
    return !!event.target && "files" in event.target && !!event.target.files;
  }
  // https://developer.mozilla.org/en-US/docs/Web/API/DataTransfer/types
  // https://developer.mozilla.org/en-US/docs/Web/API/HTML_Drag_and_Drop_API/Recommended_drag_types#file
  return Array.prototype.some.call(
    // eslint-disable-next-line @typescript-eslint/no-unsafe-member-access
    (event.dataTransfer as any)?.types,
    (type) => type === "Files" || type === "application/x-moz-file",
  );
}

export function isIeOrEdge(ua = window.navigator.userAgent) {
  return (
    ua.indexOf("MSIE ") > -1 ||
    ua.indexOf("Trident/") > -1 ||
    ua.indexOf("Edge/") > -1
  );
}

function isMIMEType(v: string) {
  return (
    v === "audio/*" ||
    v === "video/*" ||
    v === "image/*" ||
    v === "text/*" ||
    /\w+\/[-+.\w]+/g.test(v)
  );
}

function isExt(v: string) {
  return /^.*\.[\w]+$/.test(v);
}

/**
 * Convert the `{accept}` dropzone prop to an array of MIME types/extensions.
 */
function acceptPropAsAcceptAttr(accept?: AcceptProp) {
  if (isDefined(accept)) {
    return (
      Object.entries(accept)
        .reduce<string[]>((a, [mimeType, ext]) => [...a, mimeType, ...ext], [])
        // Silently discard invalid entries as pickerOptionsFromAccept warns about these
        .filter((v) => isMIMEType(v) || isExt(v))
        .join(",")
    );
  }

  return undefined;
}

export function noop() {
  // noop
}

export const routeConfigToDropzoneProps = (
  routeConfig: ExpandedRouteConfig | undefined,
) => {
  const { fileTypes, multiple } = generatePermittedFileTypes(routeConfig);

  const { maxFiles, maxSize } = Object.values(routeConfig ?? {}).reduce(
    (acc, curr) => {
      // Don't think it makes sense to have a minFileCount since they can select many times
      // acc.minFiles = Math.min(acc.minFiles, curr.minFileCount);
      acc.maxFiles = Math.max(acc.maxFiles, curr.maxFileCount);
      acc.maxSize = Math.max(acc.maxSize, fileSizeToBytes(curr.maxFileSize));
      return acc;
    },
    { maxFiles: 0, maxSize: 0 },
  );

  return {
    multiple,
    accept: acceptPropAsAcceptAttr(generateClientDropzoneAccept(fileTypes)),
    maxFiles,
    maxSize: maxSize,
  };
};

/**
 * ================================================
 *                    Reducer
 * ================================================
 */
type Payload<T extends keyof DropzoneState> = Pick<DropzoneState, T>;

type Focus = { type: "focus" };
type Blur = { type: "blur" };
type OpenDialog = { type: "openDialog" };
type CloseDialog = { type: "closeDialog" };
type SetDraggedFiles = {
  type: "setDraggedFiles";
  payload: Payload<"isDragActive" | "isDragAccept" | "isDragReject">;
};
type SetFiles = { type: "setFiles"; payload: Payload<"acceptedFiles"> };
type Reset = { type: "reset" };
type DropzoneActions =
  | Focus
  | Blur
  | OpenDialog
  | CloseDialog
  | SetDraggedFiles
  | SetFiles
  | Reset;

export const initialState = {
  isFocused: false,
  isFileDialogActive: false,
  isDragActive: false,
  isDragAccept: false,
  isDragReject: false,
  acceptedFiles: [] as FileWithState[],
};

export function reducer(
  state: DropzoneState,
  action: DropzoneActions,
): DropzoneState {
  switch (action.type) {
    case "focus":
      return {
        ...state,
        isFocused: true,
      };
    case "blur":
      return {
        ...state,
        isFocused: false,
      };
    case "openDialog":
      return {
        ...initialState,
        isFileDialogActive: true,
      };
    case "closeDialog":
      return {
        ...state,
        isFileDialogActive: false,
      };
    case "setDraggedFiles":
      return {
        ...state,
        ...action.payload,
      };
    case "setFiles":
      return {
        ...state,
        ...action.payload,
      };
    case "reset":
      return initialState;
    default:
      return state;
  }
}
