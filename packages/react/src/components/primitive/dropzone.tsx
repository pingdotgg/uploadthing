import { useDropzone } from "@uploadthing/dropzone/react";
import { generateClientDropzoneAccept } from "@uploadthing/shared";

import {
  PrimitiveComponentProps,
  PrimitiveContextMergeProvider,
  PrimitiveSlot,
  usePrimitiveValues,
} from "./root";

export function Dropzone({
  children,
  ...props
}: PrimitiveComponentProps<"div">) {
  const { setFiles, options, fileTypes, disabled, state, refs } =
    usePrimitiveValues("Dropzone");

  const { getRootProps, getInputProps, isDragActive, rootRef } = useDropzone({
    onDrop: setFiles,
    multiple: options.multiple,
    accept: fileTypes ? generateClientDropzoneAccept(fileTypes) : undefined,
    disabled,
  });

  refs.focusElementRef = rootRef;

  return (
    <PrimitiveContextMergeProvider value={{ dropzone: { isDragActive } }}>
      <div
        {...getRootProps()}
        data-drag-active={isDragActive || undefined}
        data-state={state}
        {...props}
      >
        <PrimitiveSlot>{children}</PrimitiveSlot>
        <input type="hidden" {...getInputProps()} />
      </div>
    </PrimitiveContextMergeProvider>
  );
}
