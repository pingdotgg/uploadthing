import { fromEvent } from "file-selector";
import {
  computed,
  onMounted,
  onUnmounted,
  reactive,
  ref,
  toRefs,
  watch,
} from "vue";

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
} from "./core";
import type { DropzoneOptions } from "./types";

export type DropEvent = InputEvent | DragEvent | Event;

export function useDropzone(options: DropzoneOptions) {
  const optionsRef = ref({
    disabled: false,
    maxSize: Number.POSITIVE_INFINITY,
    minSize: 0,
    multiple: true,
    maxFiles: 0,
    ...options,
  });
  watch(
    /** REVIEW: Is this how this should be done??? Feels very odd */
    () => ({ ...options }),
    (value) => {
      optionsRef.value = { ...optionsRef.value, ...value };
    },
  );

  const acceptAttr = computed(() =>
    acceptPropAsAcceptAttr(optionsRef.value.accept),
  );

  const rootRef = ref<HTMLElement>();
  const inputRef = ref<HTMLInputElement>();
  const dragTargets = ref<HTMLElement[]>([]);

  const state = reactive(initialState);

  const onWindowFocus = () => {
    if (state.isFileDialogActive) {
      setTimeout(() => {
        if (inputRef.value) {
          const { files } = inputRef.value;

          if (!files?.length) {
            state.isFileDialogActive = false;
          }
        }
      }, 300);
    }
  };

  const onDocumentDrop = (event: DropEvent) => {
    if (rootRef.value?.contains(event.target as Node)) {
      // If we intercepted an event for our instance, let it propagate down to the instance's onDrop handler
      return;
    }
    event.preventDefault();
    dragTargets.value = [];
  };

  const onDocumentDragOver = (e: Pick<Event, "preventDefault">) => {
    e.preventDefault();
  };

  onMounted(() => {
    window.addEventListener("focus", onWindowFocus, false);
    document.addEventListener("dragover", onDocumentDragOver, false);
    document.addEventListener("drop", onDocumentDrop, false);
  });
  onUnmounted(() => {
    window.removeEventListener("focus", onWindowFocus, false);
    document.removeEventListener("dragover", onDocumentDragOver, false);
    document.removeEventListener("drop", onDocumentDrop, false);
  });

  const onDragEnter = (event: DragEvent) => {
    event.preventDefault();
    event.stopPropagation();

    dragTargets.value = [...dragTargets.value, event.target as HTMLElement];

    if (isEventWithFiles(event)) {
      Promise.resolve(fromEvent(event))
        .then((files) => {
          if (isPropagationStopped(event)) return;

          const fileCount = files.length;
          const isDragAccept =
            fileCount > 0 &&
            allFilesAccepted({
              files: files as File[],
              accept: acceptAttr.value!,
              minSize: optionsRef.value.minSize,
              maxSize: optionsRef.value.maxSize,
              multiple: optionsRef.value.multiple,
              maxFiles: optionsRef.value.maxFiles,
            });
          const isDragReject = fileCount > 0 && !isDragAccept;

          state.isDragAccept = isDragAccept;
          state.isDragReject = isDragReject;
          state.isDragActive = true;
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
      } catch (err) {
        noop();
      }
    }

    return false;
  };

  const setFiles = (files: File[]) => {
    const acceptedFiles: File[] = [];

    files.forEach((file) => {
      const accepted = isFileAccepted(file, acceptAttr.value!);
      const sizeMatch = isValidSize(
        file,
        optionsRef.value.minSize,
        optionsRef.value.maxSize,
      );

      if (accepted && sizeMatch) {
        acceptedFiles.push(file);
      }
    });

    if (
      !isValidQuantity(
        acceptedFiles,
        optionsRef.value.multiple,
        optionsRef.value.maxFiles,
      )
    ) {
      acceptedFiles.splice(0);
    }

    state.acceptedFiles = acceptedFiles;
    optionsRef.value.onDrop?.(acceptedFiles);
  };

  const onDragLeave = (event: DragEvent) => {
    event.preventDefault();
    event.stopPropagation();

    // Only deactivate once the dropzone and all children have been lef
    const targets = dragTargets.value.filter((target) =>
      rootRef.value?.contains(target),
    );

    // Make sure to remove a target present multiple times only once
    // (Firefox may fire dragenter/dragleave multiple times on the same element)
    const targetIdx = targets.indexOf(event.target as HTMLElement);
    if (targetIdx !== -1) {
      targets.splice(targetIdx, 1);
    }
    dragTargets.value = targets;
    if (targets.length > 0) {
      return;
    }

    state.isDragActive = false;
    state.isDragAccept = false;
    state.isDragReject = false;
  };

  const onDrop = (event: DropEvent) => {
    event.preventDefault();
    event.stopPropagation();

    dragTargets.value = [];

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

    Object.assign(state, initialState);
  };

  const openFileDialog = () => {
    if (inputRef.value) {
      state.isFileDialogActive = true;
      inputRef.value.value = "";
      inputRef.value.click();
    }
  };

  const onKeyDown = (event: KeyboardEvent) => {
    // Ignore keyboard events bubbling up the DOM tree
    if (!rootRef.value || !rootRef.value.isEqualNode(event.target as Node)) {
      return;
    }

    if (isEnterOrSpace(event)) {
      event.preventDefault();
      openFileDialog();
    }
  };

  const onInputElementClick = (event: MouseEvent) => {
    console.log("clicked");
    event.stopPropagation();
  };

  const onFocus = () => (state.isFocused = true);
  const onBlur = () => (state.isFocused = false);
  const onClick = () => {
    console.log("clicked");
    // In IE11/Edge the file-browser dialog is blocking, therefore, use setTimeout()
    // to ensure React can handle state changes
    // See: https://github.com/react-dropzone/react-dropzone/issues/450
    isIeOrEdge() ? setTimeout(openFileDialog, 0) : openFileDialog();
  };

  const getRootProps = () => ({
    ref: rootRef,
    role: "presentation" as const,
    ...(!optionsRef.value.disabled
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
    ref: inputRef,
    type: "file",
    style: "display: none",
    accept: acceptAttr.value,
    multiple: optionsRef.value.multiple,
    tabIndex: -1,
    ...(!optionsRef.value.disabled
      ? {
          onChange: onDrop,
          onClick: onInputElementClick,
        }
      : {}),
  });

  return {
    ...toRefs(state),
    getInputProps,
    getRootProps,
    rootRef,
    inputRef,
  };
}
