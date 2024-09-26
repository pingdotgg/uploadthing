import { fromEvent } from "file-selector";
import { onMount } from "svelte";
import type { Action } from "svelte/action";
import { derived, get, writable } from "svelte/store";

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
  state: State,
) {
  const { update, subscribe } = writable(state);
  const dispatch = (action: Actions) =>
    update((state) => reducer(state, action));
  return [{ subscribe }, dispatch] as const;
}

export function createDropzone(_props: DropzoneOptions) {
  const props = writable({
    disabled: false,
    maxSize: Number.POSITIVE_INFINITY,
    minSize: 0,
    multiple: true,
    maxFiles: 0,
    ..._props,
  });

  const acceptAttr = derived(props, ($props) =>
    acceptPropAsAcceptAttr($props.accept),
  );

  const rootRef = writable<HTMLElement | null>();
  const inputRef = writable<HTMLInputElement | null>();
  let dragTargets: EventTarget[] = [];

  const [state, dispatch] = reducible(reducer, initialState);

  onMount(() => {
    const onWindowFocus = () => {
      if (get(state).isFileDialogActive) {
        setTimeout(() => {
          const input = get(inputRef);
          if (input) {
            const { files } = input;

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
  });

  onMount(() => {
    const onDocumentDrop = (event: DropEvent) => {
      const root = get(rootRef);
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
              accept: get(acceptAttr)!,
              minSize: get(props).minSize,
              maxSize: get(props).maxSize,
              multiple: get(props).multiple,
              maxFiles: get(props).maxFiles,
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

    const root = get(rootRef);
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
  };

  const setFiles = (files: File[]) => {
    const acceptedFiles: File[] = [];

    files.forEach((file) => {
      const accepted = isFileAccepted(file, get(acceptAttr)!);
      const sizeMatch = isValidSize(
        file,
        get(props).minSize,
        get(props).maxSize,
      );

      if (accepted && sizeMatch) {
        acceptedFiles.push(file);
      }
    });

    if (
      !isValidQuantity(acceptedFiles, get(props).multiple, get(props).maxFiles)
    ) {
      acceptedFiles.splice(0);
    }

    dispatch({
      type: "setFiles",
      payload: {
        acceptedFiles,
      },
    });

    get(props).onDrop(acceptedFiles);
  };

  const onDropCb = (event: DropEvent) => {
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

    dispatch({ type: "reset" });
  };

  const openFileDialog = () => {
    const input = get(inputRef);
    if (input) {
      dispatch({ type: "openDialog" });
      input.value = "";
      input.click();
    } else {
      console.warn(
        "No input element found for file picker. Please make sure to use the `dropzoneInput` action.",
      );
    }
  };

  const onKeyDown = (event: KeyboardEvent) => {
    // Ignore keyboard events bubbling up the DOM tree
    const root = get(rootRef);
    if (!root?.isEqualNode(event.target as Node)) {
      return;
    }

    if (isEnterOrSpace(event)) {
      event.preventDefault();
      openFileDialog();
    }
  };

  const onInputElementClick = (event: MouseEvent) => {
    event.stopPropagation();
  };

  const onFocus = () => dispatch({ type: "focus" });
  const onBlur = () => dispatch({ type: "blur" });
  const onClick = () => {
    // In IE11/Edge the file-browser dialog is blocking, therefore, use setTimeout()
    // to ensure React can handle state changes
    // See: https://github.com/react-dropzone/react-dropzone/issues/450
    isIeOrEdge() ? setTimeout(openFileDialog, 0) : openFileDialog();
  };

  // This is a svelte action, it should be used as "use:dropzoneRoot"
  // We should be able to refactor this when svelte 5 is released to bring it more inline
  // with the rest of the dropzone implementations
  const dropzoneRoot: Action<HTMLElement> = (node) => {
    rootRef.set(node);
    node.setAttribute("role", "presentation");
    if (!get(props).disabled) {
      node.setAttribute("tabIndex", "0");
      node.addEventListener("keydown", onKeyDown);
      node.addEventListener("focus", onFocus);
      node.addEventListener("blur", onBlur);
      node.addEventListener("click", onClick);
      node.addEventListener("dragenter", onDragEnter);
      node.addEventListener("dragover", onDragOver);
      node.addEventListener("dragleave", onDragLeave);
      node.addEventListener("drop", onDropCb);
    }
    return {
      destroy() {
        rootRef.set(null);
        node.removeEventListener("keydown", onKeyDown);
        node.removeEventListener("focus", onFocus);
        node.removeEventListener("blur", onBlur);
        node.removeEventListener("click", onClick);
        node.removeEventListener("dragenter", onDragEnter);
        node.removeEventListener("dragover", onDragOver);
        node.removeEventListener("dragleave", onDragLeave);
        node.removeEventListener("drop", onDropCb);
      },
    };
  };

  // This is a svelte action, it should be used as "use:dropzoneInput"
  const dropzoneInput: Action<HTMLInputElement, DropzoneOptions> = (
    node,
    options: DropzoneOptions,
  ) => {
    inputRef.set(node);
    node.style.display = "none";
    node.setAttribute("type", "file");
    node.setAttribute("multiple", String(options.multiple));
    node.setAttribute("disabled", String(options.disabled));
    node.setAttribute("tabIndex", "-1");
    const acceptAttrUnsub = acceptAttr.subscribe((accept) => {
      node.setAttribute("accept", accept!);
    });

    node.addEventListener("change", onDropCb);
    node.addEventListener("click", onInputElementClick);

    return {
      update(options: DropzoneOptions) {
        props.update(($props) => ({ ...$props, ...options }));
        node.setAttribute("multiple", String(options.multiple));
        node.setAttribute("disabled", String(options.disabled));
      },
      destroy() {
        inputRef.set(null);
        acceptAttrUnsub();
        node.removeEventListener("change", onDropCb);
        node.removeEventListener("click", onInputElementClick);
      },
    };
  };

  return {
    state,
    dropzoneRoot,
    dropzoneInput,
    rootRef,
  };
}
