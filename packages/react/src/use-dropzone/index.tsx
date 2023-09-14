/**
 * This is a forked version of the react-dropzone package.
 * See original source here: https://github.com/react-dropzone/react-dropzone
 * The original package is licensed under the MIT license.
 */

import type React from "react";
import {
  createRef,
  useCallback,
  useEffect,
  useMemo,
  useReducer,
  useRef,
} from "react";
import { fromEvent } from "file-selector";

import type {
  DropEvent,
  DropzoneMethods,
  DropzoneOptions,
  DropzoneState,
  FileError,
  FileRejection,
} from "./types";
import {
  acceptPropAsAcceptAttr,
  allFilesAccepted,
  canUseFileSystemAccessAPI,
  composeEventHandlers,
  ErrorCode,
  fileAccepted,
  fileMatchSize,
  isAbort,
  isEvtWithFiles,
  isIeOrEdge,
  isPropagationStopped,
  isSecurityError,
  onDocumentDragOver,
  pickerOptionsFromAccept,
} from "./utils";

export * from "./types";

const initialState: DropzoneState = {
  isFocused: false,
  isFileDialogActive: false,
  isDragActive: false,
  isDragAccept: false,
  isDragReject: false,
  acceptedFiles: [],
  fileRejections: [],
  rootRef: createRef<HTMLElement>(),
  inputRef: createRef<HTMLInputElement>(),
};

/**
 * A React hook that creates a drag 'n' drop area.
 *
 * ### Example
 *
 * ```tsx
 * function MyDropzone() {
 *   const { getRootProps, getInputProps } = useDropzone({
 *     onDrop: acceptedFiles => {
 *       // do something with the File objects, e.g. upload to some server
 *     }
 *   });
 *
 *   return (
 *     <div {...getRootProps()}>
 *       <input {...getInputProps()} />
 *       <p>Drag and drop some files here, or click to select files</p>
 *     </div>
 *   )
 * }
 * ```
 */
export function useDropzone(
  props: DropzoneOptions,
): DropzoneState & DropzoneMethods {
  const {
    accept,
    disabled = false,
    getFilesFromEvent = fromEvent,
    maxSize = Number.POSITIVE_INFINITY,
    minSize = 0,
    multiple = true,
    maxFiles = 0,
    onDragEnter,
    onDragLeave,
    onDragOver,
    onDrop,
    onDropAccepted,
    onDropRejected,
    onFileDialogCancel,
    onFileDialogOpen,
    useFsAccessApi,
    autoFocus,
    preventDropOnDocument = true,
    noClick = false,
    noKeyboard = false,
    noDrag = false,
    noDragEventsBubbling = false,
    onError,
    validator = null,
  } = props;

  const acceptAttr = useMemo(() => acceptPropAsAcceptAttr(accept), [accept]);
  const pickerTypes = useMemo(() => pickerOptionsFromAccept(accept), [accept]);

  const onFileDialogOpenCb = useMemo(
    () => (typeof onFileDialogOpen === "function" ? onFileDialogOpen : noop),
    [onFileDialogOpen],
  );
  const onFileDialogCancelCb = useMemo(
    () =>
      typeof onFileDialogCancel === "function" ? onFileDialogCancel : noop,
    [onFileDialogCancel],
  );

  const rootRef = useRef<HTMLElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  const [state, dispatch] = useReducer(reducer, initialState);
  const { isFocused, isFileDialogActive } = state;

  const fsAccessApiWorksRef = useRef(
    typeof window !== "undefined" &&
      window.isSecureContext &&
      useFsAccessApi &&
      canUseFileSystemAccessAPI(),
  );

  // Update file dialog active state when the window is focused on
  const onWindowFocus = () => {
    // Execute the timeout only if the file dialog is opened in the browser
    if (!fsAccessApiWorksRef.current && isFileDialogActive) {
      setTimeout(() => {
        if (inputRef.current) {
          const { files } = inputRef.current;

          if (!files?.length) {
            dispatch({ type: "closeDialog" });
            onFileDialogCancelCb();
          }
        }
      }, 300);
    }
  };
  useEffect(() => {
    window.addEventListener("focus", onWindowFocus, false);
    return () => {
      window.removeEventListener("focus", onWindowFocus, false);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [inputRef, isFileDialogActive, onFileDialogCancelCb, fsAccessApiWorksRef]);

  const dragTargetsRef = useRef<EventTarget[]>([]);
  const onDocumentDrop = (event: DropEvent) => {
    if (rootRef.current?.contains(event.target as Node)) {
      // If we intercepted an event for our instance, let it propagate down to the instance's onDrop handler
      return;
    }
    event.preventDefault();
    dragTargetsRef.current = [];
  };

  useEffect(() => {
    if (preventDropOnDocument) {
      document.addEventListener("dragover", onDocumentDragOver, false);
      document.addEventListener("drop", onDocumentDrop, false);
    }

    return () => {
      if (preventDropOnDocument) {
        document.removeEventListener("dragover", onDocumentDragOver);
        document.removeEventListener("drop", onDocumentDrop);
      }
    };
  }, [rootRef, preventDropOnDocument]);

  // Auto focus the root when autoFocus is true
  useEffect(() => {
    if (!disabled && autoFocus && rootRef.current) {
      rootRef.current.focus();
    }
    return noop;
  }, [rootRef, autoFocus, disabled]);

  const onErrCb = useCallback(
    (e: Error) => {
      if (onError) {
        onError(e);
      } else {
        // Let the user know something's gone wrong if they haven't provided the onError cb.
        console.error(e);
      }
    },
    [onError],
  );

  const onDragEnterCb = useCallback(
    (event: React.DragEvent<HTMLElement>) => {
      event.preventDefault();
      // Persist here because we need the event later after getFilesFromEvent() is done
      event.persist();
      stopPropagation(event);

      dragTargetsRef.current = [...dragTargetsRef.current, event.target];

      if (isEvtWithFiles(event)) {
        Promise.resolve(getFilesFromEvent(event))
          .then((files) => {
            if (isPropagationStopped(event) && !noDragEventsBubbling) {
              return;
            }

            const fileCount = files.length;
            const isDragAccept =
              fileCount > 0 &&
              allFilesAccepted({
                files: files as File[],
                accept: acceptAttr!,
                minSize,
                maxSize,
                multiple,
                maxFiles,
                validator: validator!,
              });
            const isDragReject = fileCount > 0 && !isDragAccept;

            dispatch({
              type: "setDraggedFiles",
              payload: {
                isDragAccept,
                isDragReject,
                isDragActive: true,
              },
            });

            if (onDragEnter) {
              onDragEnter(event);
            }
          })
          .catch(onErrCb);
      }
    },
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [
      getFilesFromEvent,
      onDragEnter,
      onErrCb,
      noDragEventsBubbling,
      acceptAttr,
      minSize,
      maxSize,
      multiple,
      maxFiles,
      validator,
    ],
  );

  const onDragOverCb = useCallback(
    (event: React.DragEvent<HTMLElement>) => {
      event.preventDefault();

      event.persist();
      stopPropagation(event);

      const hasFiles = isEvtWithFiles(event);
      if (hasFiles && "dataTransfer" in event && event.dataTransfer !== null) {
        try {
          event.dataTransfer.dropEffect = "copy";
        } catch {} /* eslint-disable-line no-empty */
      }

      if (hasFiles && onDragOver) {
        onDragOver(event);
      }

      return false;
    },
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [onDragOver, noDragEventsBubbling],
  );

  const onDragLeaveCb = useCallback(
    (event: React.DragEvent<HTMLElement>) => {
      event.preventDefault();
      event.persist();
      stopPropagation(event);

      // Only deactivate once the dropzone and all children have been left
      const targets = dragTargetsRef.current.filter((target) =>
        rootRef.current?.contains(target as Node),
      );
      // Make sure to remove a target present multiple times only once
      // (Firefox may fire dragenter/dragleave multiple times on the same element)
      const targetIdx = targets.indexOf(event.target);
      if (targetIdx !== -1) {
        targets.splice(targetIdx, 1);
      }
      dragTargetsRef.current = targets;
      if (targets.length > 0) {
        return;
      }

      dispatch({
        type: "setDraggedFiles",
        payload: {
          isDragActive: false,
          isDragAccept: false,
          isDragReject: false,
        },
      });

      if (isEvtWithFiles(event) && onDragLeave) {
        onDragLeave(event);
      }
    },
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [rootRef, onDragLeave, noDragEventsBubbling],
  );

  const setFiles = useCallback(
    (files: File[], event: DropEvent | null) => {
      const acceptedFiles: File[] = [];
      const fileRejections: FileRejection[] = [];

      files.forEach((file) => {
        const [accepted, acceptError] = fileAccepted(file, acceptAttr!);
        const [sizeMatch, sizeError] = fileMatchSize(file, minSize, maxSize);
        const customErrors = validator ? validator(file) : null;

        if (accepted && sizeMatch && !customErrors) {
          acceptedFiles.push(file);
        } else {
          let errors: (FileError | null | boolean)[] = [acceptError, sizeError];

          if (customErrors) {
            errors = errors.concat(customErrors);
          }

          fileRejections.push({
            file,
            errors: errors.filter((e): e is FileError => !!e),
          });
        }
      });

      if (
        (!multiple && acceptedFiles.length > 1) ||
        (multiple && maxFiles >= 1 && acceptedFiles.length > maxFiles)
      ) {
        // Reject everything and empty accepted files
        acceptedFiles.forEach((file) => {
          fileRejections.push({
            file,
            errors: [
              { code: ErrorCode.TOO_MANY_FILES, message: "Too many files" },
            ],
          });
        });
        acceptedFiles.splice(0);
      }

      dispatch({
        type: "setFiles",
        payload: {
          acceptedFiles,
          fileRejections,
        },
      });

      if (onDrop) {
        onDrop(acceptedFiles, fileRejections, event!);
      }

      if (fileRejections.length > 0 && onDropRejected) {
        onDropRejected(fileRejections, event!);
      }

      if (acceptedFiles.length > 0 && onDropAccepted) {
        onDropAccepted(acceptedFiles, event!);
      }
    },
    [
      dispatch,
      multiple,
      acceptAttr,
      minSize,
      maxSize,
      maxFiles,
      onDrop,
      onDropAccepted,
      onDropRejected,
      validator,
    ],
  );

  const onDropCb = useCallback(
    (event: React.ChangeEvent<HTMLInputElement>) => {
      event.preventDefault();
      // Persist here because we need the event later after getFilesFromEvent() is done
      event.persist();
      stopPropagation(event);

      dragTargetsRef.current = [];

      if (isEvtWithFiles(event)) {
        Promise.resolve(getFilesFromEvent(event))
          .then((files) => {
            if (isPropagationStopped(event) && !noDragEventsBubbling) {
              return;
            }
            setFiles(files as File[], event);
          })
          .catch(onErrCb);
      }
      dispatch({ type: "reset" });
    },
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [getFilesFromEvent, setFiles, onErrCb, noDragEventsBubbling],
  );

  // Fn for opening the file dialog programmatically
  const openFileDialog = useCallback(() => {
    // No point to use FS access APIs if context is not secure
    // https://developer.mozilla.org/en-US/docs/Web/Security/Secure_Contexts#feature_detection
    if (fsAccessApiWorksRef.current) {
      dispatch({ type: "openDialog" });
      onFileDialogOpenCb();
      // https://developer.mozilla.org/en-US/docs/Web/API/window/showOpenFilePicker
      const opts = {
        multiple,
        types: pickerTypes,
      };
      // eslint-disable-next-line @typescript-eslint/no-unsafe-member-access, @typescript-eslint/no-unsafe-call
      (window as any)
        .showOpenFilePicker(opts)
        .then((handles: DropEvent) => getFilesFromEvent(handles))
        .then((files: File[]) => {
          setFiles(files, null);
          dispatch({ type: "closeDialog" });
        })
        .catch((e: Error) => {
          // AbortError means the user canceled
          if (isAbort(e)) {
            onFileDialogCancelCb();
            dispatch({ type: "closeDialog" });
          } else if (isSecurityError(e)) {
            fsAccessApiWorksRef.current = false;
            // CORS, so cannot use this API
            // Try using the input
            if (inputRef.current) {
              inputRef.current.value = "";
              inputRef.current.click();
            } else {
              onErrCb(
                new Error(
                  "Cannot open the file picker because the https://developer.mozilla.org/en-US/docs/Web/API/File_System_Access_API is not supported and no <input> was provided.",
                ),
              );
            }
          } else {
            onErrCb(e);
          }
        });
      return;
    }

    if (inputRef.current) {
      dispatch({ type: "openDialog" });
      onFileDialogOpenCb();
      inputRef.current.value = "";
      inputRef.current.click();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [
    dispatch,
    onFileDialogOpenCb,
    onFileDialogCancelCb,
    useFsAccessApi,
    setFiles,
    onErrCb,
    pickerTypes,
    multiple,
  ]);

  // Cb to open the file dialog when SPACE/ENTER occurs on the dropzone
  const onKeyDownCb = useCallback(
    (event: React.KeyboardEvent) => {
      // Ignore keyboard events bubbling up the DOM tree
      if (!rootRef.current?.isEqualNode(event.target as Node)) {
        return;
      }

      if (
        ("key" in event && (event.key === " " || event.key === "Enter")) ||
        ("keyCode" in event && (event.keyCode === 32 || event.keyCode === 13))
      ) {
        event.preventDefault();
        openFileDialog();
      }
    },
    [rootRef, openFileDialog],
  );

  // Update focus state for the dropzone
  const onFocusCb = useCallback(() => {
    dispatch({ type: "focus" });
  }, []);
  const onBlurCb = useCallback(() => {
    dispatch({ type: "blur" });
  }, []);

  // Cb to open the file dialog when click occurs on the dropzone
  const onClickCb = useCallback(() => {
    if (noClick) {
      return;
    }

    // In IE11/Edge the file-browser dialog is blocking, therefore, use setTimeout()
    // to ensure React can handle state changes
    // See: https://github.com/react-dropzone/react-dropzone/issues/450
    if (isIeOrEdge()) {
      setTimeout(openFileDialog, 0);
    } else {
      openFileDialog();
    }
  }, [noClick, openFileDialog]);

  const composeHandler = (fn: (...args: any[]) => any) => {
    return disabled ? null : fn;
  };

  const composeKeyboardHandler = (fn: (...args: any[]) => any) => {
    return noKeyboard ? null : composeHandler(fn);
  };

  const composeDragHandler = (fn: (...args: any[]) => any) => {
    return noDrag ? null : composeHandler(fn);
  };

  const stopPropagation = (event: DropEvent) => {
    if (noDragEventsBubbling) {
      event.stopPropagation();
    }
  };

  interface DropzoneRootProps extends React.HTMLAttributes<HTMLElement> {
    refKey?: string;
    [key: string]: any;
  }
  // @ts-expect-error: FIXME LATER
  const getRootProps: <T extends DropzoneRootProps>(props?: T) => T = useMemo(
    () =>
      // @ts-expect-error - FIXME LATER
      ({
        refKey = "ref",
        role,
        onKeyDown,
        onFocus,
        onBlur,
        onClick,
        onDragEnter,
        onDragOver,
        onDragLeave,
        onDrop,
        ...rest
      } = {}) => ({
        onKeyDown: composeKeyboardHandler(
          composeEventHandlers(onKeyDown, onKeyDownCb),
        ),
        onFocus: composeKeyboardHandler(
          composeEventHandlers(onFocus, onFocusCb),
        ),
        onBlur: composeKeyboardHandler(composeEventHandlers(onBlur, onBlurCb)),
        onClick: composeHandler(composeEventHandlers(onClick, onClickCb)),
        onDragEnter: composeDragHandler(
          composeEventHandlers(onDragEnter, onDragEnterCb),
        ),
        onDragOver: composeDragHandler(
          composeEventHandlers(onDragOver, onDragOverCb),
        ),
        onDragLeave: composeDragHandler(
          composeEventHandlers(onDragLeave, onDragLeaveCb),
        ),
        onDrop: composeDragHandler(composeEventHandlers(onDrop, onDropCb)),
        role: typeof role === "string" && role !== "" ? role : "presentation",
        [refKey]: rootRef,
        ...(!disabled && !noKeyboard ? { tabIndex: 0 } : {}),
        ...rest,
      }),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [
      rootRef,
      onKeyDownCb,
      onFocusCb,
      onBlurCb,
      onClickCb,
      onDragEnterCb,
      onDragOverCb,
      onDragLeaveCb,
      onDropCb,
      noKeyboard,
      noDrag,
      disabled,
    ],
  );

  const onInputElementClick = useCallback((event: React.MouseEvent) => {
    event.stopPropagation();
  }, []);

  interface DropzoneInputProps
    extends React.InputHTMLAttributes<HTMLInputElement> {
    refKey?: string;
  }
  // @ts-expect-error - FIXME LATER
  const getInputProps: <T extends DropzoneInputProps>(props?: T) => T = useMemo(
    () =>
      // @ts-expect-error - FIXME LATER
      ({ refKey = "ref", onChange, onClick, ...rest } = {}) => ({
        accept: acceptAttr,
        multiple,
        type: "file",
        style: { display: "none" },
        onChange: composeHandler(composeEventHandlers(onChange, onDropCb)),
        onClick: composeHandler(
          composeEventHandlers(onClick, onInputElementClick),
        ),
        tabIndex: -1,
        [refKey]: inputRef,
        ...rest,
      }),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [inputRef, accept, multiple, onDropCb, disabled],
  );

  return {
    ...state,
    isFocused: isFocused && !disabled,
    getRootProps,
    getInputProps,
    rootRef,
    inputRef,
    open: composeHandler(openFileDialog),
  };
}

type Focus = { type: "focus" };
type Blur = { type: "blur" };
type OpenDialog = { type: "openDialog" };
type CloseDialog = { type: "closeDialog" };
type SetDraggedFiles = {
  type: "setDraggedFiles";
  payload: Pick<
    DropzoneState,
    "isDragActive" | "isDragAccept" | "isDragReject"
  >;
};
type SetFiles = {
  type: "setFiles";
  payload: Pick<DropzoneState, "acceptedFiles" | "fileRejections">;
};
type Reset = { type: "reset" };
type DropzoneActions =
  | Focus
  | Blur
  | OpenDialog
  | CloseDialog
  | SetDraggedFiles
  | SetFiles
  | Reset;
function reducer(state: DropzoneState, action: DropzoneActions): DropzoneState {
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
      return {
        ...initialState,
      };
    default:
      return state;
  }
}

function noop() {
  // noop
}

export { ErrorCode } from "./utils";
