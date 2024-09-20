"use client";

import {
  PrimitiveComponentProps,
  PrimitiveSlot,
  usePrimitiveValues,
} from "./root";

export function ClearButton({
  children,
  onClick,
  ...props
}: PrimitiveComponentProps<"label">) {
  const { setFiles, state } = usePrimitiveValues("Button");

  return (
    <label
      {...props}
      data-state={state}
      onClick={(e) => {
        onClick?.(e);
        setFiles([]);
      }}
    >
      <PrimitiveSlot default="Clear" children={children} />
    </label>
  );
}
