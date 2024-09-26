"use client";

import { ElementType, Ref } from "react";

import { forwardRefWithAs } from "../../utils/forwardRefWithAs";
import {
  HasDisplayName,
  PrimitiveComponentProps,
  PrimitiveSlot,
  RefProp,
  usePrimitiveValues,
} from "./root";

const DEFAULT_CLEAR_BUTTON_TAG = "label" as const;

export type PrimitiveClearButtonProps<
  Tag extends ElementType = typeof DEFAULT_CLEAR_BUTTON_TAG,
> = PrimitiveComponentProps<Tag>;

function ClearButtonFn<
  Tag extends ElementType = typeof DEFAULT_CLEAR_BUTTON_TAG,
>(
  { children, onClick, as, ...props }: PrimitiveClearButtonProps<Tag>,
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
  <Tag extends ElementType = typeof DEFAULT_CLEAR_BUTTON_TAG>(
    props: PrimitiveClearButtonProps<Tag> & RefProp<typeof ClearButtonFn>,
  ): JSX.Element;
};

export const ClearButton = forwardRefWithAs(
  ClearButtonFn,
) as _internal_ComponentClearButton;
