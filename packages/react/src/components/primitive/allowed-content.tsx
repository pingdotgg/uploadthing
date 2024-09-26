import { ElementType, Ref } from "react";

import { allowedContentTextLabelGenerator } from "@uploadthing/shared";

import { forwardRefWithAs } from "../../utils/forwardRefWithAs";
import {
  HasDisplayName,
  PrimitiveComponentProps,
  PrimitiveSlot,
  RefProp,
  usePrimitiveValues,
} from "./root";

const DEFAULT_ALLOWED_CONTENT_TAG = "div" as const;

export type PrimitiveAllowedContentProps<
  TTag extends ElementType = typeof DEFAULT_ALLOWED_CONTENT_TAG,
> = PrimitiveComponentProps<TTag>;

export function AllowedContentFn<
  TTag extends ElementType = typeof DEFAULT_ALLOWED_CONTENT_TAG,
>(
  { children, as, ...props }: PrimitiveAllowedContentProps<TTag>,
  ref: Ref<HTMLDivElement>,
) {
  const { routeConfig, state } = usePrimitiveValues("AllowedContent");

  const Comp = as ?? DEFAULT_ALLOWED_CONTENT_TAG;

  return (
    <Comp data-state={state} {...props} ref={ref}>
      <PrimitiveSlot
        default={allowedContentTextLabelGenerator(routeConfig)}
        children={children}
      />
    </Comp>
  );
}

type _internal_ComponentAllowedContent = HasDisplayName & {
  <TTag extends ElementType = typeof DEFAULT_ALLOWED_CONTENT_TAG>(
    props: PrimitiveAllowedContentProps<TTag> &
      RefProp<typeof AllowedContentFn>,
  ): JSX.Element;
};

export const AllowedContent = forwardRefWithAs(
  AllowedContentFn,
) as _internal_ComponentAllowedContent;
