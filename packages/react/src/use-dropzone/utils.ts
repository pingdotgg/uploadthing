import attrAccepts from "attr-accept";

import type { AcceptProp, DropEvent, FileError } from "./types";

// eslint-disable-next-line @typescript-eslint/no-unsafe-assignment
const accepts: typeof attrAccepts =
  // @ts-expect-error - ESM interop
  typeof attrAccepts === "function" ? attrAccepts : attrAccepts.default;

export const ErrorCode = {
  FILE_INVALID_TYPE: "FILE_INVALID_TYPE",
  FILE_TOO_LARGE: "FILE_TOO_LARGE",
  FILE_TOO_SMALL: "FILE_TOO_SMALL",
  TOO_MANY_FILES: "TOO_MANY_FILES",
} as const;
export type ErrorCode = (typeof ErrorCode)[keyof typeof ErrorCode];

export const getInvalidTypeRejectionErr = (accept: string | string[]) => {
  accept = Array.isArray(accept) && accept.length === 1 ? accept[0] : accept;
  const messageSuffix = Array.isArray(accept)
    ? `one of ${accept.join(", ")}`
    : accept;
  return {
    code: ErrorCode.FILE_INVALID_TYPE,
    message: `File type must be ${messageSuffix}`,
  };
};

export const getTooLargeRejectionErr = (maxSize: number) => {
  return {
    code: ErrorCode.FILE_TOO_LARGE,
    message: `File is larger than ${maxSize} ${
      maxSize === 1 ? "byte" : "bytes"
    }`,
  };
};

export const getTooSmallRejectionErr = (minSize: number) => {
  return {
    code: ErrorCode.FILE_TOO_SMALL,
    message: `File is smaller than ${minSize} ${
      minSize === 1 ? "byte" : "bytes"
    }`,
  };
};

// Firefox versions prior to 53 return a bogus MIME type for every file drag, so dragovers with
// that MIME type will always be accepted
export function fileAccepted(file: File, accept: string | string[]) {
  const isAcceptable =
    file.type === "application/x-moz-file" || accepts(file, accept);
  return [
    isAcceptable,
    isAcceptable ? null : getInvalidTypeRejectionErr(accept),
  ];
}

export function fileMatchSize(file: File, minSize: number, maxSize: number) {
  if (isDefined(file.size)) {
    if (isDefined(minSize) && isDefined(maxSize)) {
      if (file.size > maxSize) return [false, getTooLargeRejectionErr(maxSize)];
      if (file.size < minSize) return [false, getTooSmallRejectionErr(minSize)];
    } else if (isDefined(minSize) && file.size < minSize)
      return [false, getTooSmallRejectionErr(minSize)];
    else if (isDefined(maxSize) && file.size > maxSize)
      return [false, getTooLargeRejectionErr(maxSize)];
  }
  return [true, null];
}

function isDefined<T>(value: T | null | undefined): value is T {
  return value !== undefined && value !== null;
}

export function allFilesAccepted({
  files,
  accept,
  minSize,
  maxSize,
  multiple,
  maxFiles,
  validator,
}: {
  files: File[];
  accept: string | string[];
  minSize: number;
  maxSize: number;
  multiple: boolean;
  maxFiles: number;
  validator: (f: File) => FileError | FileError[] | null;
}) {
  if (
    (!multiple && files.length > 1) ||
    (multiple && maxFiles >= 1 && files.length > maxFiles)
  ) {
    return false;
  }

  return files.every((file) => {
    const [accepted] = fileAccepted(file, accept);
    const [sizeMatch] = fileMatchSize(file, minSize, maxSize);
    const customErrors = validator ? validator(file) : null;
    return accepted && sizeMatch && !customErrors;
  });
}

// React's synthetic events has event.isPropagationStopped,
// but to remain compatibility with other libs (Preact) fall back
// to check event.cancelBubble
export function isPropagationStopped(event: DropEvent) {
  if (
    "isPropagationStopped" in event &&
    typeof event.isPropagationStopped === "function"
  ) {
    return event.isPropagationStopped();
  } else if (
    "cancelBubble" in event &&
    typeof event.cancelBubble !== "undefined"
  ) {
    return event.cancelBubble;
  }
  return false;
}

export function isEvtWithFiles(event: DropEvent) {
  if (!("dataTransfer" in event && event.dataTransfer !== null)) {
    return !!event.target && "files" in event.target && !!event.target.files;
  }
  // https://developer.mozilla.org/en-US/docs/Web/API/DataTransfer/types
  // https://developer.mozilla.org/en-US/docs/Web/API/HTML_Drag_and_Drop_API/Recommended_drag_types#file
  return Array.prototype.some.call(
    event.dataTransfer.types,
    (type) => type === "Files" || type === "application/x-moz-file",
  );
}

export function isKindFile<T>(item: T) {
  return (
    typeof item === "object" &&
    item !== null &&
    "kind" in item &&
    item.kind === "file"
  );
}

// allow the entire document to be a drag target
export function onDocumentDragOver(event: DragEvent) {
  event.preventDefault();
}

function isIe(userAgent: string) {
  return (
    userAgent.indexOf("MSIE") !== -1 || userAgent.indexOf("Trident/") !== -1
  );
}

function isEdge(userAgent: string) {
  return userAgent.indexOf("Edge/") !== -1;
}

export function isIeOrEdge(userAgent = window.navigator.userAgent) {
  return isIe(userAgent) || isEdge(userAgent);
}

/**
 * This is intended to be used to compose event handlers
 * They are executed in order until one of them calls `event.isPropagationStopped()`.
 * Note that the check is done on the first invoke too,
 * meaning that if propagation was stopped before invoking the fns,
 * no handlers will be executed.
 *
 * @param {Function} fns the event hanlder functions
 * @return {Function} the event handler to add to an element
 */
export function composeEventHandlers(
  ...fns: (((...args: any[]) => any) | undefined)[]
) {
  return (event: DropEvent, ...args: any[]) =>
    fns.some((fn) => {
      if (!isPropagationStopped(event) && fn) {
        // eslint-disable-next-line @typescript-eslint/no-unsafe-argument
        fn(event, ...args);
      }
      return isPropagationStopped(event);
    });
}

/**
 * canUseFileSystemAccessAPI checks if the [File System Access API](https://developer.mozilla.org/en-US/docs/Web/API/File_System_Access_API)
 * is supported by the browser.
 * @returns {boolean}
 */
export function canUseFileSystemAccessAPI() {
  return "showOpenFilePicker" in window;
}

/**
 * Convert the `{accept}` dropzone prop to the
 * `{types}` option for https://developer.mozilla.org/en-US/docs/Web/API/window/showOpenFilePicker
 *
 * @param {AcceptProp} accept
 * @returns {{accept: string[]}[]}
 */
export function pickerOptionsFromAccept(accept?: AcceptProp) {
  if (isDefined(accept)) {
    const acceptForPicker = Object.entries(accept)
      .filter(([mimeType, ext]) => {
        let ok = true;

        if (!isMIMEType(mimeType)) {
          console.warn(
            `Skipped "${mimeType}" because it is not a valid MIME type. Check https://developer.mozilla.org/en-US/docs/Web/HTTP/Basics_of_HTTP/MIME_types/Common_types for a list of valid MIME types.`,
          );
          ok = false;
        }

        if (!Array.isArray(ext) || !ext.every(isExt)) {
          console.warn(
            `Skipped "${mimeType}" because an invalid file extension was provided.`,
          );
          ok = false;
        }

        return ok;
      })
      .reduce(
        (agg, [mimeType, ext]) => ({
          ...agg,
          [mimeType]: ext,
        }),
        {},
      );
    return [
      {
        // description is required due to https://crbug.com/1264708
        description: "Files",
        accept: acceptForPicker,
      },
    ];
  }
  return accept;
}

/**
 * Convert the `{accept}` dropzone prop to an array of MIME types/extensions.
 * @param {AcceptProp} accept
 * @returns {string}
 */
export function acceptPropAsAcceptAttr(accept?: AcceptProp) {
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

/**
 * Check if v is an exception caused by aborting a request (e.g window.showOpenFilePicker()).
 *
 * See https://developer.mozilla.org/en-US/docs/Web/API/DOMException.
 */
export function isAbort(v: any) {
  return (
    v instanceof DOMException &&
    (v.name === "AbortError" || v.code === v.ABORT_ERR)
  );
}

/**
 * Check if v is a security error.
 *
 * See https://developer.mozilla.org/en-US/docs/Web/API/DOMException.
 */
export function isSecurityError(v: any) {
  return (
    v instanceof DOMException &&
    (v.name === "SecurityError" || v.code === v.SECURITY_ERR)
  );
}

/**
 * Check if v is a MIME type string.
 *
 * See accepted format: https://developer.mozilla.org/en-US/docs/Web/HTML/Element/input/file#unique_file_type_specifiers.
 */
export function isMIMEType(v: string) {
  return (
    v === "audio/*" ||
    v === "video/*" ||
    v === "image/*" ||
    v === "text/*" ||
    /\w+\/[-+.\w]+/g.test(v)
  );
}

/**
 * Check if v is a file extension.
 */
export function isExt(v: string) {
  return /^.*\.[\w]+$/.test(v);
}
