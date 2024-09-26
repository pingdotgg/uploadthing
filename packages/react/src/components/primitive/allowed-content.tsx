import { allowedContentTextLabelGenerator } from "@uploadthing/shared";

import {
  PrimitiveComponentProps,
  PrimitiveSlot,
  usePrimitiveValues,
} from "./root";

export function AllowedContent({
  children,
  ...props
}: PrimitiveComponentProps<"div">) {
  const { routeConfig, state } = usePrimitiveValues("AllowedContent");

  return (
    <div data-state={state} {...props}>
      <PrimitiveSlot
        default={allowedContentTextLabelGenerator(routeConfig)}
        children={children}
      />
    </div>
  );
}
