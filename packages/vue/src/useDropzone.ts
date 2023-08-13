import {
  ref, watch, computed, toRefs,
  onMounted, onUnmounted, RendererElement,
  reactive,
} from 'vue'
import { fromEvent, FileWithPath } from 'file-selector'
import accepts from 'attr-accept'

type FileAccept = string | string[]
type FileHandler = (evt: Event) => void

type FileErrorCode = 'file-invalid-type' | 'file-too-large' | 'file-too-small' | 'too-many-files' | string

type FileRejectionError = { code: FileErrorCode, message: string } | null | boolean

export type InputFile = (FileWithPath | DataTransferItem) & { size?: number }

export type FileRejectReason = { file: InputFile; errors: FileRejectionError[] }

export interface FileUploadOptions {
  accept: FileAccept
  disabled: boolean
  getFilesFromEvent: (evt: Event | any) => Promise<InputFile[]>
  maxSize: number
  minSize: number
  multiple: boolean
  maxFiles: number
  onDragEnter: FileHandler
  onDragLeave: FileHandler
  onDragOver: FileHandler
  onDrop: (acceptedFiles: any[], rejectReasons: FileRejectReason[], event: Event) => void
  onDropAccepted: (acceptedFiles: InputFile[], event: Event) => void
  onDropRejected: (rejectReasons: FileRejectReason[], event: Event) => void
  onFileDialogCancel: () => void
  preventDropOnDocument: boolean
  noClick: boolean
  noKeyboard: boolean
  noDrag: boolean
  noDragEventsBubbling: boolean
}

interface UserFileUploadInitState {
  isFocused: boolean
  isFileDialogActive: boolean
  isDragAccept: boolean
  isDragActive: boolean
  isDragReject: boolean
  draggedFiles: InputFile[]
  acceptedFiles: InputFile[]
  fileRejections: FileRejectReason[]
}

type ComposeFunction = () => void

function isIe(userAgent: string) {
  return userAgent.includes('MSIE') || userAgent.includes('Trident/')
}

function isEdge(userAgent: string) {
  return userAgent.includes('Edge/')
}

export function isIeOrEdge(userAgent: string = window.navigator.userAgent): boolean {
  return isIe(userAgent) || isEdge(userAgent)
}

export function onDocumentDragOver(event: Event): void {
  event.preventDefault()
}

export function isEvtWithFiles(event: Event & { dataTransfer?: { types: string }; target?: EventTarget & { files: InputFile[] } } | any): boolean {
  if (!event.dataTransfer) {
    return !!event.target && !!event.target.files
  }
  // https://developer.mozilla.org/en-US/docs/Web/API/DataTransfer/types
  // https://developer.mozilla.org/en-US/docs/Web/API/HTML_Drag_and_Drop_API/Recommended_drag_types#file
  return Array.prototype.some.call(
    event.dataTransfer.types,
    type => type === 'Files' || type === 'application/x-moz-file',
  )
}

export function isPropagationStopped(event: Event & { isPropagationStopped?: () => boolean }): boolean {
  if (typeof event.isPropagationStopped === 'function') {
    return event.isPropagationStopped()
  }
  if (typeof event.cancelBubble !== 'undefined') {
    return event.cancelBubble
  }
  return false
}

export const FILE_INVALID_TYPE = 'file-invalid-type'
export const FILE_TOO_LARGE = 'file-too-large'
export const FILE_TOO_SMALL = 'file-too-small'
export const TOO_MANY_FILES = 'too-many-files'

export const TOO_MANY_FILES_REJECTION: FileRejectionError = {
  code: TOO_MANY_FILES,
  message: 'Too many files',
}

// File Errors
export const getInvalidTypeRejectionErr = (accept: FileAccept): FileRejectionError => {
  // eslint-disable-next-line no-param-reassign
  accept = Array.isArray(accept) && accept.length === 1 ? accept[0] : accept
  const messageSuffix = Array.isArray(accept) ? `one of ${accept.join(', ')}` : accept
  return {
    code: FILE_INVALID_TYPE,
    message: `File type must be ${messageSuffix}`,
  }
}

function isDefined(value: any) {
  return value !== undefined && value !== null
}

// Firefox versions prior to 53 return a bogus MIME type for every file drag, so dragovers with
// that MIME type will always be accepted
export function fileAccepted(file: InputFile, accept: FileAccept): [boolean, null | FileRejectionError] {
  const isAcceptable = file.type === 'application/x-moz-file' || accepts(file, accept)
  return [isAcceptable, isAcceptable ? null : getInvalidTypeRejectionErr(accept)]
}

export const getTooLargeRejectionErr = (maxSize: number): FileRejectionError => ({
  code: FILE_TOO_LARGE,
  message: `File is larger than ${maxSize} bytes`,
})

export const getTooSmallRejectionErr = (minSize: number): FileRejectionError => ({
  code: FILE_TOO_SMALL,
  message: `File is smaller than ${minSize} bytes`,
})

export function fileMatchSize(file: InputFile, minSize: number, maxSize: number) {
  if (isDefined(file.size) && file.size) {
    if (isDefined(minSize) && isDefined(maxSize)) {
      if (file.size > maxSize) return [false, getTooLargeRejectionErr(maxSize)]
      if (file.size < minSize) return [false, getTooSmallRejectionErr(minSize)]
    } else if (isDefined(minSize) && file.size < minSize) {
      return [false, getTooSmallRejectionErr(minSize)]
    } else if (isDefined(maxSize) && file.size > maxSize) {
      return [false, getTooLargeRejectionErr(maxSize)]
    }
  }
  return [true, null]
}

export function composeEventHandlers(...fns: any): any {
  return (event: Event, ...args: any) => fns.some((fn: any) => {
    if (!isPropagationStopped(event) && fn) {
      fn(event, ...args)
    }
    return isPropagationStopped(event)
  })
}


export function allFilesAccepted({
  files, accept, minSize, maxSize, multiple, maxFiles,
}: any) {
  if ((!multiple && files.length > 1) || (multiple && maxFiles >= 1 && files.length > maxFiles)) {
    return false
  }

  return files.every((file: InputFile) => {
    const [accepted] = fileAccepted(file, accept)
    const [sizeMatch] = fileMatchSize(file, minSize, maxSize)
    return accepted && sizeMatch
  })
}


const defaultProps: Partial<FileUploadOptions> = {
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
}

export function useDropzone(options: Partial<FileUploadOptions> = {}) {
  const optionsRef = ref({
    ...defaultProps,
    ...options,
  })

  watch(() => ({ ...options }), (value) => {
    optionsRef.value = { ...optionsRef.value, ...value }
  })

  const rootRef = ref<RendererElement>()
  const inputRef = ref<RendererElement>()

  const state = reactive<UserFileUploadInitState>({
    isFocused: false,
    isFileDialogActive: false,
    isDragActive: false,
    isDragAccept: false,
    isDragReject: false,
    draggedFiles: [],
    acceptedFiles: [],
    fileRejections: [],
  })

  const openFileDialog = () => {
    if (inputRef.value) {
      state.isFileDialogActive = true
      inputRef.value.value = ''
      inputRef.value.click()
    }
  }

  const onWindowFocus = () => {
    const { onFileDialogCancel } = optionsRef.value
    // Execute the timeout only if the file dialog is opened in the browser
    if (state.isFileDialogActive) {
      setTimeout(() => {
        if (inputRef.value) {
          const { files } = inputRef.value

          if (files && !files.length) {
            state.isFileDialogActive = false
            if (typeof onFileDialogCancel === 'function') {
              onFileDialogCancel()
            }
          }
        }
      }, 300)
    }
  }

  function onFocusCb() {
    state.isFocused = true
  }

  function onBlurCb() {
    state.isFocused = false
  }

  function onClickCb() {
    const { noClick } = optionsRef.value
    if (noClick) {
      return
    }
    if (isIeOrEdge()) {
      setTimeout(openFileDialog, 0)
    } else {
      openFileDialog()
    }
  }

  const dragTargetsRef = ref<any>([])
  const onDocumentDrop = (event: Event) => {
    if (!rootRef.value) {
      return
    }
    const rootElm = rootRef.value.$el || rootRef.value
    if (rootElm.contains(event.target as Node)) {
      // If we intercepted an event for our instance,
      // let it propagate down to the instance's onDrop handler
      return
    }
    event.preventDefault()
    dragTargetsRef.value = []
  }

  onMounted(() => {
    window.addEventListener('focus', onWindowFocus, false)
    const { preventDropOnDocument } = optionsRef.value
    if (preventDropOnDocument) {
      document.addEventListener('dragover', onDocumentDragOver, false)
      document.addEventListener('drop', onDocumentDrop, false)
    }
  })

  onUnmounted(() => {
    window.removeEventListener('focus', onWindowFocus, false)
    const { preventDropOnDocument } = optionsRef.value
    if (preventDropOnDocument) {
      document.removeEventListener('dragover', onDocumentDragOver)
      document.removeEventListener('drop', onDocumentDrop)
    }
  })

  function stopPropagation(event: Event) {
    const { noDragEventsBubbling } = optionsRef.value
    if (noDragEventsBubbling) {
      event.stopPropagation()
    }
  }

  async function onDragEnterCb(event: Event) {
    const { getFilesFromEvent, noDragEventsBubbling, onDragEnter } = optionsRef.value
    event.preventDefault()
    // Persist here because we need the event later after getFilesFromEvent() is done
    stopPropagation(event)

    dragTargetsRef.value = [...dragTargetsRef.value, event.target]

    if (isEvtWithFiles(event)) {
      if (!getFilesFromEvent) {
        return
      }
      let draggedFilesRes = await getFilesFromEvent(event)
      if (!draggedFilesRes) {
        draggedFilesRes = []
      }
      if (isPropagationStopped(event) && !noDragEventsBubbling) {
        return
      }

      state.draggedFiles = draggedFilesRes
      state.isDragActive = true

      if (onDragEnter) {
        onDragEnter(event)
      }
    }
  }

  function onDragOverCb(event: Event & { dataTransfer?: { dropEffect: string } }) {
    const { onDragOver } = optionsRef.value
    event.preventDefault()
    stopPropagation(event)

    if (event.dataTransfer) {
      try {
        // eslint-disable-next-line no-param-reassign
        event.dataTransfer.dropEffect = 'copy'
      } catch {
        //
      }
    }

    if (isEvtWithFiles(event) && onDragOver) {
      onDragOver(event)
    }

    return false
  }

  function onDragLeaveCb(event: Event) {
    event.preventDefault()
    stopPropagation(event)

    // Only deactivate once the dropzone and all children have been left
    const targets = dragTargetsRef.value.filter(
      (target: EventTarget) => {
        if (!rootRef.value) {
          return false
        }
        const rootElm = rootRef.value.$el || rootRef.value
        return rootElm.contains(target)
      }
    )
    // Make sure to remove a target present multiple times only once
    // (Firefox may fire dragenter/dragleave multiple times on the same element)
    const targetIdx = targets.indexOf(event.target)
    if (targetIdx !== -1) {
      targets.splice(targetIdx, 1)
    }
    dragTargetsRef.value = targets
    if (targets.length > 0) {
      return
    }

    state.draggedFiles = []
    state.isDragActive = false

    const { onDragLeave } = optionsRef.value
    if (isEvtWithFiles(event) && onDragLeave) {
      onDragLeave(event)
    }
  }

  function onDropCb(event: Event) {
    event.preventDefault()
    // Persist here because we need the event later after getFilesFromEvent() is done
    stopPropagation(event)

    dragTargetsRef.value = []

    const {
      getFilesFromEvent, noDragEventsBubbling,
      accept, minSize, maxSize, multiple, maxFiles,
      onDrop, onDropRejected, onDropAccepted,
    } = optionsRef.value
    if (isEvtWithFiles(event)) {
      if (!getFilesFromEvent) {
        return
      }
      Promise.resolve(getFilesFromEvent(event)).then((files) => {
        if (isPropagationStopped(event) && !noDragEventsBubbling) {
          return
        }

        const acceptedFiles: InputFile[] = []
        const fileRejections: FileRejectReason[] = []

        files.forEach((file) => {
          const [accepted, acceptError] = fileAccepted(file, accept as FileAccept)
          const [sizeMatch, sizeError] = fileMatchSize(file, minSize as number, maxSize as number)
          if (accepted && sizeMatch) {
            acceptedFiles.push(file)
          } else {
            const errors = [acceptError, sizeError].filter(e => e)
            fileRejections.push({ file, errors })
          }
        })

        if ((!multiple && acceptedFiles.length > 1) || (multiple && (maxFiles as number) >= 1 && acceptedFiles.length > (maxFiles as number))) {
          // Reject everything and empty accepted files
          acceptedFiles.forEach((file) => {
            fileRejections.push({ file, errors: [TOO_MANY_FILES_REJECTION] })
          })
          acceptedFiles.splice(0)
        }

        state.acceptedFiles = acceptedFiles
        state.fileRejections = fileRejections

        if (onDrop) {
          onDrop(acceptedFiles, fileRejections, event)
        }

        if (fileRejections.length > 0 && onDropRejected) {
          onDropRejected(fileRejections, event)
        }

        if (acceptedFiles.length > 0 && onDropAccepted) {
          onDropAccepted(acceptedFiles, event)
        }
      })
    }

    state.isFileDialogActive = false
    state.isDragActive = false
    state.draggedFiles = []
    state.acceptedFiles = []
    state.fileRejections = []
  }

  const composeHandler = (fn: ComposeFunction) => (optionsRef.value.disabled ? undefined : fn)

  const composeKeyboardHandler = (fn: ComposeFunction) => (optionsRef.value.noKeyboard ? undefined : composeHandler(fn))

  const composeDragHandler = (fn: ComposeFunction) => (optionsRef.value.noDrag ? undefined : composeHandler(fn))

  const getRootProps = ({
    onFocus,
    onBlur,
    onClick,
    onDragEnter,
    onDragenter,
    onDragOver,
    onDragover,
    onDragLeave,
    onDragleave,
    onDrop,
    ...rest
  }: {
    [key: string]: any
  } = {}) => ({
    onFocus: composeKeyboardHandler(composeEventHandlers(onFocus, onFocusCb)),
    onBlur: composeKeyboardHandler(composeEventHandlers(onBlur, onBlurCb)),
    onClick: composeHandler(composeEventHandlers(onClick, onClickCb)),
    onDragenter: composeDragHandler(composeEventHandlers(onDragEnter, onDragenter, onDragEnterCb)),
    onDragover: composeDragHandler(composeEventHandlers(onDragOver, onDragover, onDragOverCb)),
    onDragleave: composeDragHandler(composeEventHandlers(onDragLeave, onDragleave, onDragLeaveCb)),
    onDrop: composeDragHandler(composeEventHandlers(onDrop, onDropCb)),
    ref: rootRef,
    ...(!optionsRef.value.disabled && !optionsRef.value.noKeyboard ? { tabIndex: 0 } : {}),
    ...rest,
  })

  const onInputElementClick = (event: Event) => {
    event.stopPropagation()
  }

  function getInputProps({
    onChange,
    onClick,
    ...rest
  }: { onChange?: () => void; onClick?: () => void } = {}) {
    const inputProps = {
      accept: optionsRef.value.accept as string,
      multiple: optionsRef.value.multiple,
      style: 'display: none',
      type: 'file',
      onChange: composeHandler(composeEventHandlers(onChange, onDropCb)),
      onClick: composeHandler(composeEventHandlers(onClick, onInputElementClick)),
      autoComplete: 'off',
      tabIndex: -1,
      ref: inputRef,
    }

    return {
      ...inputProps,
      ...rest,
    }
  }

  const fileCount = computed(() => (state.draggedFiles ? state.draggedFiles.length : 0))
  const isDragAccept = computed(() => fileCount.value > 0 && allFilesAccepted({
    files: state.draggedFiles,
    accept: optionsRef.value.accept,
    minSize: optionsRef.value.minSize,
    maxSize: optionsRef.value.maxSize,
    multiple: optionsRef.value.multiple,
    maxFiles: optionsRef.value.maxFiles,
  }))
  const isDragReject = computed(() => fileCount.value > 0 && !isDragAccept.value)

  return {
    ...toRefs(state),
    isDragAccept,
    isDragReject,
    isFocused: computed(() => state.isFocused && !optionsRef.value.disabled),
    getRootProps,
    getInputProps,
    rootRef,
    inputRef,
    open: composeHandler(openFileDialog),
  }
}