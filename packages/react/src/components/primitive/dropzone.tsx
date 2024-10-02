"use client";

import { useCallback, useEffect, useMemo, useReducer, useRef } from "react";
import type {
  ChangeEvent,
  DragEvent,
  ElementType,
  HTMLProps,
  KeyboardEvent,
  MouseEvent,
  Ref,
} from "react";
import { fromEvent } from "file-selector";

import {
  acceptPropAsAcceptAttr,
  allFilesAccepted,
  generateClientDropzoneAccept,
  initialState,
  isEnterOrSpace,
  isEventWithFiles,
  isFileAccepted,
  isIeOrEdge,
  isValidQuantity,
  isValidSize,
  noop,
  reducer,
  type DropzoneOptions,
} from "@uploadthing/shared";

import { forwardRefWithAs } from "../../utils/forwardRefWithAs";
import {
  PrimitiveContextMergeProvider,
  PrimitiveSlot,
  usePrimitiveValues,
} from "./root";
import type { HasDisplayName, PrimitiveComponentProps, RefProp } from "./root";

const DEFAULT_DROPZONE_TAG = "div" as const;

export type PrimitiveDropzoneProps<
  TTag extends ElementType = typeof DEFAULT_DROPZONE_TAG,
> = PrimitiveComponentProps<TTag> & { disabled?: boolean | undefined };

function DropzoneFn<TTag extends ElementType = typeof DEFAULT_DROPZONE_TAG>(
  {
    children,
    as,
    disabled: componentDisabled,
    ...props
  }: PrimitiveDropzoneProps<TTag>,
  ref: Ref<HTMLDivElement>,
) {
  const {
    setFiles,
    options,
    fileTypes,
    disabled: rootDisabled,
    state,
    refs,
  } = usePrimitiveValues("Dropzone");

  const { getRootProps, getInputProps, isDragActive, rootRef } = useDropzone({
    onDrop: setFiles,
    multiple: options.multiple,
    accept: fileTypes ? generateClientDropzoneAccept(fileTypes) : undefined,
    disabled: rootDisabled || componentDisabled,
  });

  const Comp = as ?? DEFAULT_DROPZONE_TAG;

  refs.focusElementRef = rootRef;

  return (
    <PrimitiveContextMergeProvider value={{ dropzone: { isDragActive } }}>
      <Comp
        {...getRootProps()}
        data-drag-active={isDragActive || undefined}
        data-state={state}
        {...props}
        ref={ref}
      >
        <PrimitiveSlot>{children}</PrimitiveSlot>
        <input type="hidden" {...getInputProps()} />
      </Comp>
    </PrimitiveContextMergeProvider>
  );
}

type _internal_ComponentDropzone = HasDisplayName & {
  <TTag extends ElementType = typeof DEFAULT_DROPZONE_TAG>(
    props: PrimitiveDropzoneProps<TTag> & RefProp<typeof DropzoneFn>,
  ): JSX.Element;
};

export const Dropzone = forwardRefWithAs(
  DropzoneFn,
) as _internal_ComponentDropzone;

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
  accept,
  disabled = false,
  maxSize = Number.POSITIVE_INFINITY,
  minSize = 0,
  multiple = true,
  maxFiles = 0,
  onDrop,
}: DropzoneOptions) {
  const acceptAttr = useMemo(() => acceptPropAsAcceptAttr(accept), [accept]);

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
                accept: acceptAttr!,
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
    [acceptAttr, maxFiles, maxSize, minSize, multiple],
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
      const acceptedFiles: File[] = [];

      files.forEach((file) => {
        const accepted = isFileAccepted(file, acceptAttr!);
        const sizeMatch = isValidSize(file, minSize, maxSize);

        if (accepted && sizeMatch) {
          acceptedFiles.push(file);
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
    [acceptAttr, maxFiles, maxSize, minSize, multiple, onDrop],
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
            setFiles(files as File[]);
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
      accept: acceptAttr,
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
    [acceptAttr, multiple, onDropCb, onInputElementClick, disabled],
  );

  return {
    ...state,
    getRootProps,
    getInputProps,
    rootRef,
  };
}
