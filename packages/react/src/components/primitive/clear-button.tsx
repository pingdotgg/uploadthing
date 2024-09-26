"use client";

import type { ElementType, Ref } from "react";

import { forwardRefWithAs } from "../../utils/forwardRefWithAs";
import { PrimitiveSlot, usePrimitiveValues } from "./root";
import type { HasDisplayName, PrimitiveComponentProps, RefProp } from "./root";

const DEFAULT_CLEAR_BUTTON_TAG = "label" as const;

export type PrimitiveClearButtonProps<
  TTag extends ElementType = typeof DEFAULT_CLEAR_BUTTON_TAG,
> = PrimitiveComponentProps<TTag>;

function ClearButtonFn<
  TTag extends ElementType = typeof DEFAULT_CLEAR_BUTTON_TAG,
>(
  { children, onClick, as, ...props }: PrimitiveClearButtonProps<TTag>,
  ref: Ref<HTMLLabelElement>,
) {
  const { setFiles, state } = usePrimitiveValues("ClearButton");
  const Comp = as ?? DEFAULT_CLEAR_BUTTON_TAG;

  return (
    <Comp
      {...props}
      data-state={state}
      onClick={(e) => {
        onClick?.(e);
        setFiles([]);
      }}
      ref={ref}
    >
      <PrimitiveSlot default="Clear" children={children} />
    </Comp>
  );
}

type _internal_ComponentClearButton = HasDisplayName & {
  <TTag extends ElementType = typeof DEFAULT_CLEAR_BUTTON_TAG>(
    props: PrimitiveClearButtonProps<TTag> & RefProp<typeof ClearButtonFn>,
  ): JSX.Element;
};

export const ClearButton = forwardRefWithAs(
  ClearButtonFn,
) as _internal_ComponentClearButton;
