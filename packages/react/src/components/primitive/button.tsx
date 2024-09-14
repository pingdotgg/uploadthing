"use client";

import {
  PrimitiveComponentProps,
  PrimitiveSlot,
  usePrimitiveValues,
} from "./root";

export function Button({
  children,
  onClick,
  ...props
}: PrimitiveComponentProps<"label">) {
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

  return (
    <label
      {...props}
      data-state={state}
      onClick={(e) => {
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
    </label>
  );
}
