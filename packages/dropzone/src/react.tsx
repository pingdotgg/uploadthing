/**
 * This is a forked version of the react-dropzone package, that's been minified
 * to suit UploadThing's needs and be easily portable to other frameworks than React.
 * See original source here: https://github.com/react-dropzone/react-dropzone
 * The original package is licensed under the MIT license.
 */

import type {
  ChangeEvent,
  DragEvent,
  HTMLProps,
  KeyboardEvent,
  MouseEvent,
} from "react";
import { useCallback, useEffect, useMemo, useReducer, useRef } from "react";
import { fromEvent } from "file-selector";

import type { FileWithState } from "@uploadthing/shared";

import {
  allFilesAccepted,
  initialState,
  isEnterOrSpace,
  isEventWithFiles,
  isFileAccepted,
  isIeOrEdge,
  isValidQuantity,
  isValidSize,
  noop,
  reducer,
  routeConfigToDropzoneProps,
} from "./core";
import type { DropzoneOptions } from "./types";

export type * from "./types";

export type DropEvent =
  | Event
  | React.DragEvent<HTMLElement>
  | React.ChangeEvent<HTMLElement>;

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
export function useDropzone({
  routeConfig,
  disabled = false,
  minSize = 0,
  onDrop,
}: DropzoneOptions) {
  const { accept, multiple, maxFiles, maxSize } = useMemo(
    () => routeConfigToDropzoneProps(routeConfig),
    [routeConfig],
  );

  const rootRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const dragTargetsRef = useRef<EventTarget[]>([]);

  const [state, dispatch] = useReducer(reducer, initialState);

  useEffect(() => {
    // Update file dialog active state when the window is focused on
    const onWindowFocus = () => {
      // Execute the timeout only if the file dialog is opened in the browser
      if (state.isFileDialogActive) {
        setTimeout(() => {
          if (inputRef.current) {
            const { files } = inputRef.current;

            if (!files?.length) {
              dispatch({ type: "closeDialog" });
            }
          }
        }, 300);
      }
    };

    window.addEventListener("focus", onWindowFocus, false);
    return () => {
      window.removeEventListener("focus", onWindowFocus, false);
    };
  }, [state.isFileDialogActive]);

  useEffect(() => {
    const onDocumentDrop = (event: DropEvent) => {
      // If we intercepted an event for our instance, let it propagate down to the instance's onDrop handler
      if (rootRef.current?.contains(event.target as Node)) return;

      event.preventDefault();
      dragTargetsRef.current = [];
    };
    const onDocumentDragOver = (e: Pick<Event, "preventDefault">) =>
      e.preventDefault();

    document.addEventListener("dragover", onDocumentDragOver, false);
    document.addEventListener("drop", onDocumentDrop, false);

    return () => {
      document.removeEventListener("dragover", onDocumentDragOver);
      document.removeEventListener("drop", onDocumentDrop);
    };
  }, []);

  const onDragEnter = useCallback(
    (event: DragEvent<HTMLElement>) => {
      event.preventDefault();
      event.persist();

      dragTargetsRef.current = [...dragTargetsRef.current, event.target];

      if (isEventWithFiles(event)) {
        Promise.resolve(fromEvent(event))
          .then((files) => {
            if (event.isPropagationStopped()) return;

            const fileCount = files.length;
            const isDragAccept =
              fileCount > 0 &&
              allFilesAccepted({
                files: files as File[],
                accept,
                minSize,
                maxSize,
                multiple,
                maxFiles,
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
          })
          .catch(noop);
      }
    },
    [accept, maxFiles, maxSize, minSize, multiple],
  );

  const onDragOver = useCallback((event: DragEvent<HTMLElement>) => {
    event.preventDefault();
    event.persist();

    const hasFiles = isEventWithFiles(event);
    if (hasFiles && event.dataTransfer !== null) {
      try {
        event.dataTransfer.dropEffect = "copy";
      } catch {
        noop();
      }
    }

    return false;
  }, []);

  const onDragLeave = useCallback((event: DragEvent<HTMLElement>) => {
    event.preventDefault();
    event.persist();

    // Only deactivate once the dropzone and all children have been left
    const targets = dragTargetsRef.current.filter((target) =>
      rootRef.current?.contains(target as Node),
    );

    // Make sure to remove a target present multiple times only once
    // (Firefox may fire dragenter/dragleave multiple times on the same element)
    const targetIdx = targets.indexOf(event.target);
    if (targetIdx !== -1) targets.splice(targetIdx, 1);
    dragTargetsRef.current = targets;
    if (targets.length > 0) return;

    dispatch({
      type: "setDraggedFiles",
      payload: {
        isDragActive: false,
        isDragAccept: false,
        isDragReject: false,
      },
    });
  }, []);

  const setFiles = useCallback(
    (files: File[]) => {
      const acceptedFiles: FileWithState[] = [];

      files.forEach((file) => {
        const accepted = isFileAccepted(file, accept);
        const sizeMatch = isValidSize(file, minSize, maxSize);

        if (accepted && sizeMatch) {
          const fileWithState: FileWithState = Object.assign(file, {
            status: "pending" as const,
            key: null,
          });
          acceptedFiles.push(fileWithState);
        }
      });

      if (!isValidQuantity(acceptedFiles, multiple, maxFiles)) {
        acceptedFiles.splice(0);
      }

      dispatch({
        type: "setFiles",
        payload: {
          acceptedFiles,
        },
      });

      onDrop(acceptedFiles);
    },
    [accept, maxFiles, maxSize, minSize, multiple, onDrop],
  );

  const onDropCb = useCallback(
    (event: ChangeEvent<HTMLElement>) => {
      event.preventDefault();
      event.persist();

      dragTargetsRef.current = [];

      if (isEventWithFiles(event)) {
        Promise.resolve(fromEvent(event))
          .then((files) => {
            if (event.isPropagationStopped()) return;

            console.log("files in onDrop", files);

            const filesWithState = (files as File[]).map((file) =>
              Object.assign(file, {
                status: "pending" as const,
                key: null,
              }),
            );
            setFiles(filesWithState);
          })
          .catch(noop);
      }
      dispatch({ type: "reset" });
    },
    [setFiles],
  );

  const openFileDialog = useCallback(() => {
    if (inputRef.current) {
      dispatch({ type: "openDialog" });
      inputRef.current.value = "";
      inputRef.current.click();
    }
  }, []);

  // Cb to open the file dialog when SPACE/ENTER occurs on the dropzone
  const onKeyDown = useCallback(
    (event: KeyboardEvent) => {
      // Ignore keyboard events bubbling up the DOM tree
      if (!rootRef.current?.isEqualNode(event.target as Node)) return;

      if (isEnterOrSpace(event)) {
        event.preventDefault();
        openFileDialog();
      }
    },
    [openFileDialog],
  );

  const onInputElementClick = useCallback((e: MouseEvent) => {
    e.stopPropagation();
  }, []);

  // Update focus state for the dropzone
  const onFocus = useCallback(() => dispatch({ type: "focus" }), []);
  const onBlur = useCallback(() => dispatch({ type: "blur" }), []);

  const onClick = useCallback(() => {
    // In IE11/Edge the file-browser dialog is blocking, therefore,
    // use setTimeout() to ensure React can handle state changes
    isIeOrEdge() ? setTimeout(openFileDialog, 0) : openFileDialog();
  }, [openFileDialog]);

  const getRootProps = useMemo(
    () => (): HTMLProps<HTMLDivElement> => ({
      ref: rootRef,
      role: "presentation",
      ...(!disabled
        ? {
            tabIndex: 0,
            onKeyDown,
            onFocus,
            onBlur,
            onClick,
            onDragEnter,
            onDragOver,
            onDragLeave,
            // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment
            onDrop: onDropCb as any,
          }
        : {}),
    }),
    [
      disabled,
      onBlur,
      onClick,
      onDragEnter,
      onDragLeave,
      onDragOver,
      onDropCb,
      onFocus,
      onKeyDown,
    ],
  );

  const getInputProps = useMemo(
    () => (): HTMLProps<HTMLInputElement> => ({
      ref: inputRef,
      type: "file",
      style: { display: "none" },
      accept: accept,
      multiple,
      tabIndex: -1,
      ...(!disabled
        ? {
            // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment
            onChange: onDropCb as any,
            onClick: onInputElementClick,
          }
        : {}),
    }),
    [accept, multiple, onDropCb, onInputElementClick, disabled],
  );

  return {
    ...state,
    getRootProps,
    getInputProps,
    rootRef,
  };
}
