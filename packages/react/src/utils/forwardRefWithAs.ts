"use client";

import { forwardRef } from "react";

/**
 * This is a hack, but basically we want to keep the full 'API' of the component, but we do want to
 * wrap it in a forwardRef so that we _can_ passthrough the ref
 * @see https://github.com/tailwindlabs/headlessui/blob/main/packages/%40headlessui-react/src/utils/render.ts#L431
 */
export function forwardRefWithAs<
  T extends { name: string; displayName?: string },
>(component: T): T & { displayName: string } {
  return Object.assign(forwardRef(component as any) as any, {
    displayName: component.displayName ?? component.name,
  });
}
