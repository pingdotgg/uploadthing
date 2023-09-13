<script lang="ts">
  import { fromEvent } from "file-selector";
  import { createEventDispatcher, onDestroy } from "svelte";

  import {
    fileAccepted,
    fileMatchSize,
    isEvtWithFiles,
    isIeOrEdge,
    isPropagationStopped,
    normalizeAccept,
    onDocumentDragOver,
    TOO_MANY_FILES_REJECTION,
  } from "../utils/dropzone";
  import type {
    ComposeFunction,
    DropEvent,
    DropzoneOptions,
    FileAccept,
    FileRejectReason,
    InputFile,
  } from "../utils/dropzone";

  interface Dispatch {
    drop: DropEvent;
    dragEnter: Event;
    dragLeave: Event;
    dragOver: Event;
    dropAccepted: { acceptedFiles: InputFile[]; event: Event };
    dropRejected: { rejectReasons: FileRejectReason[]; event: Event };
    fileDialogCancel: void;
  }

  // readonly props
  export let options: Partial<DropzoneOptions> = {};
  // binding props
  export let isFocused = false;
  export let isDragActive = false;
  export let draggedFiles: InputFile[] = [];
  export let state: "readying" | "ready" | "uploading";
  export let inputRef: HTMLInputElement | null;

  let rootRef: HTMLElement;
  let dragTargetsRef: (EventTarget | null)[] = [];
  let isFileDialogActive = false;
  let acceptedFiles: InputFile[] = [];
  let fileRejections: FileRejectReason[] = [];

  const dispatch = createEventDispatcher<Dispatch>();
  const defaultOptions: DropzoneOptions = {
    disabled: false,
    getFilesFromEvent: fromEvent,
    maxSize: Infinity,
    minSize: 0,
    multiple: true,
    maxFiles: 0,
    preventDropOnDocument: true,
    noClick: false,
    noKeyboard: false,
    noDrag: false,
    noDragEventsBubbling: false,
    accept: undefined,
  };

  $: combinedOptions = {
    ...defaultOptions,
    ...options,
  } satisfies DropzoneOptions;

  const openFileDialog = () => {
    if (inputRef) {
      isFileDialogActive = true;
      inputRef.value = "";
      inputRef.click();
    }
  };

  const onWindowFocus = () => {
    // Execute the timeout only if the file dialog is opened in the browser
    if (isFileDialogActive) {
      setTimeout(() => {
        if (inputRef) {
          const { files } = inputRef;

          if (files && !files.length) {
            isFileDialogActive = false;
            dispatch("fileDialogCancel");
          }
        }
      }, 300);
    }
  };

  const onKeyDownCb = (event: Event) => {
    if (!rootRef) {
      return;
    }
    if (!rootRef.isEqualNode(event.target as Node | null)) {
      return;
    }

    if ("keyCode" in event) {
      if (event.keyCode === 32 || event.keyCode === 13) {
        event.preventDefault();
        openFileDialog();
      }
    }
  };

  const onFocusCb = () => {
    isFocused = true;
  };

  const onBlurCb = () => {
    isFocused = false;
  };

  const onClickCb = () => {
    if (combinedOptions.noClick) {
      return;
    }
    if (isIeOrEdge()) {
      setTimeout(openFileDialog, 0);
    } else {
      openFileDialog();
    }
  };

  const onDocumentDrop = (event: Event) => {
    if (!rootRef) {
      return;
    }
    if (rootRef.contains(event.target as Node)) {
      // If we intercepted an event for our instance,
      // let it propagate down to the instance's onDrop handler
      return;
    }
    event.preventDefault();
    dragTargetsRef = [];
  };

  onDestroy(() => {
    // This is critical for canceling the timeout behaviour on `onWindowFocus()`
    inputRef = null;
  });

  const onDragEnterCb = async (event: Event) => {
    const { getFilesFromEvent, noDragEventsBubbling } = combinedOptions;
    dragTargetsRef = [...dragTargetsRef, event.target];

    if (isEvtWithFiles(event)) {
      if (!getFilesFromEvent) {
        return;
      }
      let draggedFilesRes = await getFilesFromEvent(event);
      if (!draggedFilesRes) {
        draggedFilesRes = [];
      }
      if (isPropagationStopped(event) && !noDragEventsBubbling) {
        return;
      }

      draggedFiles = draggedFilesRes;
      isDragActive = true;
      dispatch("dragEnter", event);
    }
  };

  const onDragOverCb = (
    event: Event & { dataTransfer?: { dropEffect: string } },
  ) => {
    if (event.dataTransfer) {
      try {
        event.dataTransfer.dropEffect = "copy";
      } catch {
        //
      }
    }

    if (isEvtWithFiles(event)) {
      dispatch("dragOver", event);
    }

    return false;
  };

  const onDragLeaveCb = (event: Event) => {
    // Only deactivate once the dropzone and all children have been left
    const targets = dragTargetsRef.filter((target) => {
      if (!rootRef) {
        return false;
      }
      return rootRef.contains(target as Node);
    });
    // Make sure to remove a target present multiple times only once
    // (Firefox may fire dragenter/dragleave multiple times on the same element)
    const targetIdx = targets.indexOf(event.target);
    if (targetIdx !== -1) {
      targets.splice(targetIdx, 1);
    }
    dragTargetsRef = targets;
    if (targets.length > 0) {
      return;
    }

    draggedFiles = [];
    isDragActive = false;

    if (isEvtWithFiles(event)) {
      dispatch("dragLeave", event);
    }
  };

  const onDropCb = async (event: Event) => {
    const {
      getFilesFromEvent,
      noDragEventsBubbling,
      accept,
      minSize,
      maxSize,
      multiple,
      maxFiles,
    } = combinedOptions;
    dragTargetsRef = [];
    if (isEvtWithFiles(event)) {
      if (!getFilesFromEvent) {
        return;
      }
      const files = await getFilesFromEvent(event);

      if (isPropagationStopped(event) && !noDragEventsBubbling) {
        return;
      }

      files.forEach((file) => {
        const [accepted, acceptError] = fileAccepted(file, accept ?? "");
        const [sizeMatch, sizeError] = fileMatchSize(file, minSize, maxSize);
        if (accepted && sizeMatch) {
          acceptedFiles = [...acceptedFiles, file];
        } else {
          const errors = [acceptError, sizeError].filter((e) => e);
          fileRejections = [...fileRejections, { file, errors }];
        }
      });

      if (
        (!multiple && acceptedFiles.length > 1) ||
        (multiple && maxFiles >= 1 && acceptedFiles.length > maxFiles)
      ) {
        // Reject everything and empty accepted files
        acceptedFiles.forEach((file) => {
          fileRejections = [
            ...fileRejections,
            { file, errors: [TOO_MANY_FILES_REJECTION] },
          ];
        });
        acceptedFiles = [];
      }

      dispatch("drop", {
        acceptedFiles,
        rejectReasons: fileRejections,
        event,
      });

      if (fileRejections.length > 0) {
        dispatch("dropRejected", { rejectReasons: fileRejections, event });
      }

      if (acceptedFiles.length > 0) {
        dispatch("dropAccepted", { acceptedFiles, event });
      }
    }
    isFileDialogActive = false;
    isDragActive = false;
    draggedFiles = [];
    acceptedFiles = [];
    fileRejections = [];
  };

  const composeHandler = (fn: ComposeFunction) =>
    combinedOptions.disabled ? undefined : fn;

  const composeKeyboardHandler = (fn: ComposeFunction) =>
    combinedOptions.noKeyboard ? undefined : composeHandler(fn);

  const composeDragHandler = (fn: ComposeFunction) =>
    combinedOptions.noDrag ? undefined : composeHandler(fn);

  const getInputAccept = (accept: FileAccept | undefined) => {
    const normalizedAccept = normalizeAccept(accept ?? "");
    return Array.isArray(normalizedAccept)
      ? normalizedAccept.join("")
      : normalizedAccept;
  };

  $: inputProps = {
    multiple: combinedOptions.multiple,
    disabled: combinedOptions.disabled,
    accept: getInputAccept(combinedOptions.accept),
    style: "display: none",
    type: "file",
    autoComplete: "off",
    tabIndex: -1,
  };
</script>

<!--
@component
Example:
```tsx
  <Dropzone
    bind:inputRef
    bind:isDragActive
    class="ut-text-center"
    let:inputProps
    let:onInputChange
    options={{
      accept: fileTypes ? generateClientDropzoneAccept(fileTypes) : undefined
    }}
    on:drop={(e) => onDrop(e.detail.acceptedFiles)}
  >
    <input
      class="ut-sr-only"
      {...inputProps}
      on:change|preventDefault={onInputChange}
      bind:this={inputRef}
    />
  </Dropzone>
```
-->
<svelte:window
  on:focus={onWindowFocus}
  on:dragover={(e) =>
    !combinedOptions.preventDropOnDocument && onDocumentDragOver(e)}
  on:drop={(e) => !combinedOptions.preventDropOnDocument && onDocumentDrop(e)}
/>
<div
  bind:this={rootRef}
  role="button"
  tabindex={combinedOptions.disabled && combinedOptions.noKeyboard
    ? 0
    : undefined}
  class={$$props.class}
  style={$$props.style}
  data-state={state}
  on:keydown={composeKeyboardHandler(onKeyDownCb)}
  on:focus={composeKeyboardHandler(onFocusCb)}
  on:blur={composeKeyboardHandler(onBlurCb)}
  on:click={composeHandler(onClickCb)}
  on:dragenter|preventDefault={composeDragHandler(onDragEnterCb)}
  on:dragover|preventDefault={composeDragHandler(onDragOverCb)}
  on:dragleave|preventDefault={composeDragHandler(onDragLeaveCb)}
  on:drop|preventDefault={composeDragHandler(onDropCb)}
>
  <slot {inputProps} onInputChange={composeHandler(onDropCb)}>
    <input
      {...inputProps}
      on:change|preventDefault={composeHandler(onDropCb)}
      on:click|stopPropagation
      bind:this={inputRef}
    />
  </slot>
</div>
