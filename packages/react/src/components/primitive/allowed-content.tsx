import { allowedContentTextLabelGenerator } from "@uploadthing/shared";

import {
  PrimitiveComponentChildrenProp,
  PrimitiveSlot,
  usePrimitiveValues,
} from "./root";

export function AllowedContent(props: PrimitiveComponentChildrenProp) {
  const { routeConfig } = usePrimitiveValues("AllowedContent");

  return (
    <PrimitiveSlot
      default={allowedContentTextLabelGenerator(routeConfig)}
      children={props.children}
    />
  );
}
