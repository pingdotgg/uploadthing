/**
 * This is a forked version of the react-dropzone package, that's been minified
 * to suit UploadThing's needs and be easily portable to other frameworks than React.
 * See original source here: https://github.com/react-dropzone/react-dropzone
 * The original package is licensed under the MIT license.
 */

import { fromEvent } from "file-selector";
import {
  createEffect,
  createMemo,
  createSignal,
  mergeProps,
  onCleanup,
} from "solid-js";
import { createStore } from "solid-js/store";

import type { FileWithState } from "@uploadthing/shared";

import {
  allFilesAccepted,
  initialState,
  isEnterOrSpace,
  isEventWithFiles,
  isFileAccepted,
  isIeOrEdge,
  isPropagationStopped,
  isValidQuantity,
  isValidSize,
  noop,
  routeConfigToDropzoneProps,
} from "./core";
import type { DropzoneOptions } from "./types";

export type * from "./types";

export type DropEvent = InputEvent | DragEvent | Event;

export function createDropzone(_props: DropzoneOptions) {
  const props = mergeProps(
    {
      disabled: false,
      minSize: 0,
    },
    _props,
  );

  const routeProps = createMemo(() =>
    routeConfigToDropzoneProps(props.routeConfig),
  );

  const [rootRef, setRootRef] = createSignal<HTMLElement | null>();
  const [inputRef, setInputRef] = createSignal<HTMLInputElement | null>();
  let dragTargets: HTMLElement[] = [];

  const [state, setState] = createStore(initialState);

  createEffect(() => {
    const onWindowFocus = () => {
      if (state.isFileDialogActive) {
        setTimeout(() => {
          const input = inputRef();
          if (input) {
            const { files } = input;

            if (!files?.length) {
              setState("isFileDialogActive", false);
            }
          }
        }, 300);
      }
    };

    window.addEventListener("focus", onWindowFocus, false);
    onCleanup(() => {
      window.removeEventListener("focus", onWindowFocus, false);
    });
  });

  createEffect(() => {
    const onDocumentDrop = (event: DropEvent) => {
      const root = rootRef();

      // If we intercepted an event for our instance, let it propagate down to the instance's onDrop handler
      if (root?.contains(event.target as Node)) return;

      event.preventDefault();
      dragTargets = [];
    };

    const onDocumentDragOver = (e: Pick<Event, "preventDefault">) =>
      e.preventDefault();

    document.addEventListener("dragover", onDocumentDragOver, false);
    document.addEventListener("drop", onDocumentDrop, false);

    onCleanup(() => {
      document.removeEventListener("dragover", onDocumentDragOver, false);
      document.removeEventListener("drop", onDocumentDrop, false);
    });
  });

  const onDragEnter = (event: DragEvent) => {
    event.preventDefault();

    dragTargets = [...dragTargets, event.target as HTMLElement];

    if (isEventWithFiles(event)) {
      Promise.resolve(fromEvent(event))
        .then((files) => {
          if (isPropagationStopped(event)) return;

          const fileCount = files.length;
          const isDragAccept =
            fileCount > 0 &&
            allFilesAccepted({
              files: files as File[],
              minSize: props.minSize,
              ...routeProps(),
            });
          const isDragReject = fileCount > 0 && !isDragAccept;

          setState({
            isDragAccept,
            isDragReject,
            isDragActive: true,
          });
        })
        .catch(noop);
    }
  };

  const onDragOver = (event: DragEvent) => {
    event.preventDefault();
    event.stopPropagation();

    const hasFiles = isEventWithFiles(event);
    if (hasFiles && event.dataTransfer) {
      try {
        event.dataTransfer.dropEffect = "copy";
      } catch {
        noop();
      }
    }

    return false;
  };

  const onDragLeave = (event: DragEvent) => {
    event.preventDefault();
    event.stopPropagation();

    const root = rootRef();
    // Only deactivate once the dropzone and all children have been left
    const targets = dragTargets.filter((target) => root?.contains(target));
    // Make sure to remove a target present multiple times only once
    // (Firefox may fire dragenter/dragleave multiple times on the same element)
    const targetIdx = targets.indexOf(event.target as HTMLElement);
    if (targetIdx !== -1) {
      targets.splice(targetIdx, 1);
    }
    dragTargets = targets;
    if (targets.length > 0) {
      return;
    }

    setState({
      isDragActive: false,
      isDragAccept: false,
      isDragReject: false,
    });
  };

  const setFiles = (files: File[]) => {
    const acceptedFiles: FileWithState[] = [];

    files.forEach((file) => {
      const accepted = isFileAccepted(file, routeProps().accept);
      const sizeMatch = isValidSize(file, props.minSize, routeProps().maxSize);

      if (accepted && sizeMatch) {
        const fileWithState: FileWithState = Object.assign(file, {
          status: "pending" as const,
          key: null,
        });
        acceptedFiles.push(fileWithState);
      }
    });

    if (
      !isValidQuantity(
        acceptedFiles,
        routeProps().multiple,
        routeProps().maxFiles,
      )
    ) {
      acceptedFiles.splice(0);
    }

    setState({
      acceptedFiles,
    });
    props.onDrop?.(acceptedFiles);
  };

  const onDrop = (event: DropEvent) => {
    event.preventDefault();

    dragTargets = [];

    if (isEventWithFiles(event)) {
      Promise.resolve(fromEvent(event))
        .then((files) => {
          if (isPropagationStopped(event)) {
            return;
          }
          setFiles(files as File[]);
        })
        .catch(noop);
    }

    setState(initialState);
  };

  const openFileDialog = () => {
    const input = inputRef();
    if (input) {
      setState("isFileDialogActive", true);
      input.value = "";
      input.click();
    }
  };

  const onKeyDown = (event: KeyboardEvent) => {
    const root = rootRef();

    // Ignore keyboard events bubbling up the DOM tree
    if (!root?.isEqualNode(event.target as Node)) return;

    if (isEnterOrSpace(event)) {
      event.preventDefault();
      openFileDialog();
    }
  };

  const onInputElementClick = (event: MouseEvent) => {
    event.stopPropagation();
  };

  const onFocus = () => setState("isFocused", true);
  const onBlur = () => setState("isFocused", false);
  const onClick = () => () => {
    // In IE11/Edge the file-browser dialog is blocking, therefore, use setTimeout()
    // to ensure React can handle state changes
    // See: https://github.com/react-dropzone/react-dropzone/issues/450
    isIeOrEdge() ? setTimeout(openFileDialog, 0) : openFileDialog();
  };

  const getRootProps = () => ({
    ref: setRootRef,
    role: "presentation" as const,
    ...(!props.disabled
      ? {
          tabIndex: 0,
          onKeyDown,
          onFocus,
          onBlur,
          onClick,
          onDragEnter,
          onDragOver,
          onDragLeave,
          onDrop,
        }
      : {}),
  });

  const getInputProps = () => ({
    ref: setInputRef,
    type: "file",
    style: { display: "none" },
    accept: routeProps().accept,
    multiple: routeProps().multiple,
    tabIndex: -1,
    ...(!props.disabled
      ? {
          onChange: onDrop,
          onClick: onInputElementClick,
        }
      : {}),
  });

  return mergeProps(state, {
    getInputProps,
    getRootProps,
    rootRef: setRootRef,
    inputRef: setInputRef,
  });
}
