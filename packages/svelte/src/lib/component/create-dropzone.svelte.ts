import { fromEvent } from "file-selector";
import { onMount, untrack } from "svelte";

import {
  acceptPropAsAcceptAttr,
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
  reducer,
} from "@uploadthing/shared";
import type { DropzoneOptions } from "@uploadthing/shared";

export type DropEvent = InputEvent | DragEvent | Event;

function reducible<State, Actions>(
  reducer: (state: State, action: Actions) => State,
  initialState: State,
) {
  let state = $state(initialState);
  const dispatch = (action: Actions) => {
    state = reducer(
      untrack(() => state),
      action,
    );
  };
  return {
    get state() {
      return state;
    },
    dispatch,
  };
}

export function createDropzone({
  rootRef,
  inputRef,
  ..._props
}: DropzoneOptions & {
  rootRef: HTMLElement | undefined;
  inputRef: HTMLInputElement | undefined;
}) {
  const props = $derived({
    disabled: false,
    maxSize: Number.POSITIVE_INFINITY,
    minSize: 0,
    multiple: true,
    maxFiles: 0,
    ..._props,
  });

  const acceptAttr = $derived(acceptPropAsAcceptAttr(props.accept));

  let dragTargets: EventTarget[] = $state([]);

  // Cannot destructure when using runes state
  const dropzoneState = reducible(reducer, initialState);

  onMount(() => {
    const onWindowFocus = () => {
      if (dropzoneState.state.isFileDialogActive) {
        setTimeout(() => {
          const input = inputRef;
          if (input) {
            const { files } = input;

            if (!files?.length) {
              dropzoneState.dispatch({ type: "closeDialog" });
            }
          }
        }, 300);
      }
    };
    window.addEventListener("focus", onWindowFocus, false);

    return () => {
      window.removeEventListener("focus", onWindowFocus, false);
    };
  });

  onMount(() => {
    const onDocumentDrop = (event: DropEvent) => {
      const root = rootRef;
      if (root?.contains(event.target as Node)) {
        // If we intercepted an event for our instance, let it propagate down to the instance's onDrop handler
        return;
      }
      event.preventDefault();
      dragTargets = [];
    };

    const onDocumentDragOver = (e: Pick<Event, "preventDefault">) =>
      e.preventDefault();

    document.addEventListener("dragover", onDocumentDragOver, false);
    document.addEventListener("drop", onDocumentDrop, false);

    return () => {
      document.removeEventListener("dragover", onDocumentDragOver, false);
      document.removeEventListener("drop", onDocumentDrop, false);
    };
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
              accept: acceptAttr!,
              minSize: props.minSize,
              maxSize: props.maxSize,
              multiple: props.multiple,
              maxFiles: props.maxFiles,
            });
          const isDragReject = fileCount > 0 && !isDragAccept;

          dropzoneState.dispatch({
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
  };

  const onDragOver = (event: DragEvent) => {
    event.preventDefault();

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

    const root = rootRef;
    // Only deactivate once the dropzone and all children have been left
    const targets = dragTargets.filter((target) =>
      root?.contains(target as Node),
    );
    // Make sure to remove a target present multiple times only once
    // (Firefox may fire dragenter/dragleave multiple times on the same element)
    const targetIdx = targets.indexOf(event.target as HTMLElement);
    if (targetIdx !== -1) {
      targets.splice(targetIdx, 1);
    }
    dragTargets = targets;
    if (targets.length > 0) return;

    dropzoneState.dispatch({
      type: "setDraggedFiles",
      payload: {
        isDragActive: false,
        isDragAccept: false,
        isDragReject: false,
      },
    });
  };

  const setFiles = (files: File[]) => {
    const acceptedFiles: File[] = [];
    const { minSize, maxSize, multiple, maxFiles, onDrop } = props;

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

    dropzoneState.dispatch({
      type: "setFiles",
      payload: {
        acceptedFiles,
      },
    });

    onDrop(acceptedFiles);
  };

  const onDropCb = (event: DropEvent) => {
    event.preventDefault();

    dragTargets = [];

    if (isEventWithFiles(event)) {
      Promise.resolve(fromEvent(event))
        .then((files) => {
          if (isPropagationStopped(event)) return;
          setFiles(files as File[]);
        })
        .catch(noop);
    }
    dropzoneState.dispatch({ type: "reset" });
  };

  const openFileDialog = () => {
    const input = inputRef;
    if (input) {
      input.value = "";
      input.click();
      dropzoneState.dispatch({ type: "openDialog" });
    }
  };

  const onKeyDown = (event: KeyboardEvent) => {
    // Ignore keyboard events bubbling up the DOM tree
    const root = rootRef;
    if (!root?.isEqualNode(event.target as Node)) return;

    if (isEnterOrSpace(event)) {
      event.preventDefault();
      openFileDialog();
    }
  };

  const onInputElementClick = (event: MouseEvent) => {
    event.stopPropagation();
    if (dropzoneState.state.isFileDialogActive) {
      event.preventDefault();
    }
  };

  const onFocus = () => dropzoneState.dispatch({ type: "focus" });
  const onBlur = () => dropzoneState.dispatch({ type: "blur" });
  const onClick = () => {
    // In IE11/Edge the file-browser dialog is blocking, therefore, use setTimeout()
    // to ensure React can handle state changes
    // See: https://github.com/react-dropzone/react-dropzone/issues/450
    isIeOrEdge() ? setTimeout(openFileDialog, 0) : openFileDialog();
  };

  const rootProps = $derived({
    role: "presentation",
    ...(!props.disabled
      ? {
          tabindex: 0,
          onkeydown: onKeyDown,
          onfocus: onFocus,
          onblur: onBlur,
          onclick: onClick,
          ondragenter: onDragEnter,
          ondragover: onDragOver,
          ondragleave: onDragLeave,
          // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment
          ondrop: onDropCb as any,
        }
      : {}),
  });

  const inputProps = $derived({
    type: "file",
    style: "display: none",
    accept: acceptAttr,
    multiple: props.multiple,
    tabindex: -1,
    ...(!props.disabled
      ? {
          // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment
          onchange: onDropCb as any,
          onclick: onInputElementClick,
        }
      : {}),
  });

  return {
    get rootProps() {
      return rootProps;
    },
    get inputProps() {
      return inputProps;
    },
    get state() {
      return dropzoneState.state;
    },
  };
}
