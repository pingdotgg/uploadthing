import { ElementType, Ref } from "react";

import { useDropzone } from "@uploadthing/dropzone/react";
import { generateClientDropzoneAccept } from "@uploadthing/shared";

import { forwardRefWithAs } from "../../utils/forwardRefWithAs";
import {
  HasDisplayName,
  PrimitiveComponentProps,
  PrimitiveContextMergeProvider,
  PrimitiveSlot,
  RefProp,
  usePrimitiveValues,
} from "./root";

const DEFAULT_DROPZONE_TAG = "div" as const;

export type PrimitiveDropzoneProps<
  TTag extends ElementType = typeof DEFAULT_DROPZONE_TAG,
> = PrimitiveComponentProps<TTag>;

function DropzoneFn<TTag extends ElementType = typeof DEFAULT_DROPZONE_TAG>(
  { children, as, ...props }: PrimitiveDropzoneProps<TTag>,
  ref: Ref<HTMLDivElement>,
) {
  const { setFiles, options, fileTypes, disabled, state, refs } =
    usePrimitiveValues("Dropzone");

  const { getRootProps, getInputProps, isDragActive, rootRef } = useDropzone({
    onDrop: setFiles,
    multiple: options.multiple,
    accept: fileTypes ? generateClientDropzoneAccept(fileTypes) : undefined,
    disabled,
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
