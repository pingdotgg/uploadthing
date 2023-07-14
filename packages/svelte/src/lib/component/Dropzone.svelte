<script lang="ts">
  import { fromEvent } from "file-selector";
  import { createEventDispatcher, onDestroy } from "svelte";

  import {
    composeEventHandlers,
    fileAccepted,
    fileMatchSize,
    isEvtWithFiles,
    isIeOrEdge,
    isPropagationStopped,
    onDocumentDragOver,
    TOO_MANY_FILES_REJECTION,
    useDropzoneReducer,
    type ComposeFunction,
    type FileAccept,
    type FileHandler,
    type FileRejectReason,
    type InputFile,
  } from "../utils/dropzone";

  // default props
  export let disabled = false;
  export let getFilesFromEvent = fromEvent;
  export let maxSize = Infinity;
  export let minSize = 0;
  export let multiple = true;
  export let maxFiles = 0;
  export let preventDropOnDocument = true;
  export let noClick = false;
  export let noKeyboard = false;
  export let noDrag = false;
  export let noDragEventsBubbling = false;
  // required props
  export let inputRef: HTMLInputElement | null;
  export let onDrop: (
    acceptedFiles: any[],
    rejectReasons: FileRejectReason[],
    event: Event,
  ) => void;
  // optional props
  export let accept: FileAccept | undefined = undefined;
  export let onDragEnter: FileHandler | undefined = undefined;
  export let onDragLeave: FileHandler | undefined = undefined;
  export let onDragOver: FileHandler | undefined = undefined;
  export let onDropAccepted:
    | ((acceptedFiles: InputFile[], event: Event) => void)
    | undefined = undefined;
  export let onDropRejected:
    | ((rejectReasons: FileRejectReason[], event: Event) => void)
    | undefined = undefined;
  export let onFileDialogCancel: (() => void) | undefined = undefined;

  let rootRef: HTMLElement;
  let dragTargetsRef: any[] = [];

  const eventDispatch = createEventDispatcher<{ dragging: boolean }>();
  const [state, dispatch] = useDropzoneReducer({
    isFocused: false,
    isFileDialogActive: false,
    isDragActive: false,
    isDragAccept: false,
    isDragReject: false,
    draggedFiles: [],
    acceptedFiles: [],
    fileRejections: [],
  });

  const openFileDialog = () => {
    if (inputRef) {
      dispatch({ type: "openDialog" });
      inputRef.value = "";
      inputRef.click();
    }
  };

  const onWindowFocus = () => {
    // Execute the timeout only if the file dialog is opened in the browser
    if ($state.isFileDialogActive) {
      setTimeout(() => {
        if (inputRef) {
          const { files } = inputRef;

          if (files && !files.length) {
            dispatch({ type: "closeDialog" });
            if (typeof onFileDialogCancel === "function") {
              onFileDialogCancel();
            }
          }
        }
      }, 300);
    }
  };

  function onKeyDownCb(event: Event) {
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
  }

  function onFocusCb() {
    dispatch({ type: "focus" });
  }

  function onBlurCb() {
    dispatch({ type: "blur" });
  }

  function onClickCb() {
    if (noClick) {
      return;
    }
    if (isIeOrEdge()) {
      setTimeout(openFileDialog, 0);
    } else {
      openFileDialog();
    }
  }

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

  function stopPropagation(event: Event) {
    if (noDragEventsBubbling) {
      event.stopPropagation();
    }
  }

  async function onDragEnterCb(event: Event) {
    // Persist here because we need the event later after getFilesFromEvent() is done
    stopPropagation(event);

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

      dispatch({
        draggedFiles: draggedFilesRes,
        isDragActive: true,
        type: "setDraggedFiles",
      });
      eventDispatch("dragging", true);

      if (onDragEnter) {
        onDragEnter(event);
      }
    }
  }

  function onDragOverCb(
    event: Event & { dataTransfer?: { dropEffect: string } },
  ) {
    stopPropagation(event);

    if (event.dataTransfer) {
      try {
        event.dataTransfer.dropEffect = "copy";
      } catch {
        //
      }
    }

    if (isEvtWithFiles(event) && onDragOver) {
      onDragOver(event);
    }

    return false;
  }

  function onDragLeaveCb(event: Event) {
    stopPropagation(event);

    // Only deactivate once the dropzone and all children have been left
    const targets = dragTargetsRef.filter((target: EventTarget) => {
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

    dispatch({
      isDragActive: false,
      type: "setDraggedFiles",
      draggedFiles: [],
    });
    eventDispatch("dragging", false);

    if (isEvtWithFiles(event) && onDragLeave) {
      onDragLeave(event);
    }
  }

  async function onDropCb(event: Event) {
    // Persist here because we need the event later after getFilesFromEvent() is done
    stopPropagation(event);

    dragTargetsRef = [];

    if (isEvtWithFiles(event)) {
      if (!getFilesFromEvent) {
        return;
      }
      const files = await getFilesFromEvent(event);

      if (isPropagationStopped(event) && !noDragEventsBubbling) {
        return;
      }

      const acceptedFiles: InputFile[] = [];
      const fileRejections: FileRejectReason[] = [];

      files.forEach((file) => {
        const [accepted, acceptError] = fileAccepted(
          file,
          accept as FileAccept,
        );
        const [sizeMatch, sizeError] = fileMatchSize(
          file,
          minSize as number,
          maxSize as number,
        );
        if (accepted && sizeMatch) {
          acceptedFiles.push(file);
        } else {
          const errors = [acceptError, sizeError].filter((e) => e);
          fileRejections.push({ file, errors });
        }
      });

      if (
        (!multiple && acceptedFiles.length > 1) ||
        (multiple &&
          (maxFiles as number) >= 1 &&
          acceptedFiles.length > (maxFiles as number))
      ) {
        // Reject everything and empty accepted files
        acceptedFiles.forEach((file) => {
          fileRejections.push({ file, errors: [TOO_MANY_FILES_REJECTION] });
        });
        acceptedFiles.splice(0);
      }

      dispatch({
        acceptedFiles,
        fileRejections,
        type: "setFiles",
      });

      if (onDrop) {
        onDrop(acceptedFiles, fileRejections, event);
        eventDispatch("dragging", false);
      }

      if (fileRejections.length > 0 && onDropRejected) {
        onDropRejected(fileRejections, event);
      }

      if (acceptedFiles.length > 0 && onDropAccepted) {
        onDropAccepted(acceptedFiles, event);
      }
    }
    dispatch({ type: "reset" });
  }

  const composeHandler = (fn: ComposeFunction) => (disabled ? undefined : fn);

  const composeKeyboardHandler = (fn: ComposeFunction) =>
    noKeyboard ? undefined : composeHandler(fn);

  const composeDragHandler = (fn: ComposeFunction) =>
    noDrag ? undefined : composeHandler(fn);

  const onInputElementClick = (event: Event) => {
    event.stopPropagation();
  };

  function getInputProps({
    onChange,
    onClick,
    ...rest
  }: { onChange?: () => void; onClick?: () => void } = {}) {
    const inputProps = {
      accept,
      multiple,
      style: "display: none",
      type: "file",
      onChange: composeHandler(composeEventHandlers(onChange, onDropCb)),
      onClick: composeHandler(
        composeEventHandlers(onClick, onInputElementClick),
      ),
      autoComplete: "off",
      tabIndex: -1,
      ref: inputRef,
    };
    return {
      ...inputProps,
      ...rest,
    };
  }
</script>

<!--
@component
Example:
```tsx
  <Dropzone
    bind:inputRef
    class="ut-text-center"
    let:inputProps
    {onDrop}
    accept={fileTypes}
    on:dragging={(e) => (isDragActive = e.detail)}
  >
    <input
      class="ut-sr-only"
      {...inputProps}
      disabled={!ready}
      accept={Array.isArray(accept) ? accept.join("") : accept}
      on:change={inputProps.onChange}
      on:click={inputProps.onClick}
      bind:this={inputRef}
    />
  </Dropzone>
```
-->
<svelte:window
  on:focus={onWindowFocus}
  on:dragover={(e) => !preventDropOnDocument && onDocumentDragOver(e)}
  on:drop={(e) => !preventDropOnDocument && onDocumentDrop(e)}
/>
<div
  bind:this={rootRef}
  role="button"
  tabindex={disabled && noKeyboard ? 0 : undefined}
  class={$$props.class}
  on:keydown={composeKeyboardHandler(onKeyDownCb)}
  on:focus={composeKeyboardHandler(onFocusCb)}
  on:blur={composeKeyboardHandler(onBlurCb)}
  on:click={composeHandler(onClickCb)}
  on:dragenter|preventDefault={composeDragHandler(
    composeEventHandlers(onDragEnter, onDragEnterCb),
  )}
  on:dragover|preventDefault={composeDragHandler(
    composeEventHandlers(onDragOver, onDragOverCb),
  )}
  on:dragleave|preventDefault={composeDragHandler(
    composeEventHandlers(onDragLeave, onDragLeaveCb),
  )}
  on:drop|preventDefault={composeDragHandler(
    composeEventHandlers(onDrop, onDropCb),
  )}
>
  <slot inputProps={getInputProps()} />
</div>
