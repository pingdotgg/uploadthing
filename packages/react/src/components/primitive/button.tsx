"use client";

import type { ElementType, Ref } from "react";

import { forwardRefWithAs } from "../../utils/forwardRefWithAs";
import { PrimitiveSlot, usePrimitiveValues } from "./root";
import type { HasDisplayName, PrimitiveComponentProps, RefProp } from "./root";

const DEFAULT_BUTTON_TAG = "label" as const;

export type PrimitiveButtonProps<
  TTag extends ElementType = typeof DEFAULT_BUTTON_TAG,
> = PrimitiveComponentProps<TTag>;

function ButtonFn<TTag extends ElementType = typeof DEFAULT_BUTTON_TAG>(
  { children, onClick, as, ...props }: PrimitiveButtonProps<TTag>,
  ref: Ref<HTMLLabelElement>,
) {
  const {
    refs,
    disabled,
    setFiles,
    dropzone,
    accept,
    state,
    files,
    abortUpload,
    options,
    uploadFiles,
  } = usePrimitiveValues("Button");

  const Comp = as ?? DEFAULT_BUTTON_TAG;

  return (
    <Comp
      {...props}
      data-state={state}
      aria-disabled={disabled}
      onClick={(e) => {
        if (disabled) return;

        onClick?.(e);
        if (state === "uploading") {
          e.preventDefault();
          e.stopPropagation();
          abortUpload();
          return;
        }
        if (options.mode === "manual" && files.length > 0) {
          e.preventDefault();
          e.stopPropagation();

          uploadFiles();
        }
      }}
      ref={ref}
    >
      <PrimitiveSlot>{children}</PrimitiveSlot>
      {!dropzone && (
        <input
          type="file"
          ref={refs.fileInputRef}
          multiple={options.multiple}
          accept={accept}
          onChange={(e) => {
            if (!e.target.files) return;
            setFiles(Array.from(e.target.files));
          }}
          disabled={disabled}
          tabIndex={disabled ? -1 : 0}
          className="sr-only"
        />
      )}
    </Comp>
  );
}

type _internal_ComponentButton = HasDisplayName & {
  <TTag extends ElementType = typeof DEFAULT_BUTTON_TAG>(
    props: PrimitiveButtonProps<TTag> & RefProp<typeof ButtonFn>,
  ): JSX.Element;
};

export const Button = forwardRefWithAs(ButtonFn) as _internal_ComponentButton;
