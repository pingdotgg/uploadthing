// Ripped from https://github.com/scottrippey/react-use-event-hook
import React from "react";

type AnyFunction = (...args: any[]) => any;

/**
 * Suppress the warning when using useLayoutEffect with SSR. (https://reactjs.org/link/uselayouteffect-ssr)
 * Make use of useInsertionEffect if available.
 */
const useInsertionEffect =
  typeof window !== "undefined"
    ? // useInsertionEffect is available in React 18+
      React.useInsertionEffect || React.useLayoutEffect
    : () => {
        /** void */
      };

/**
 * Similar to useCallback, with a few subtle differences:
 * - The returned function is a stable reference, and will always be the same between renders
 * - No dependency lists required
 * - Properties or state accessed within the callback will always be "current"
 */
export function useEvent<TCallback extends AnyFunction>(
  callback: TCallback,
): TCallback {
  // Keep track of the latest callback:
  const latestRef = React.useRef<TCallback>(
    // eslint-disable-next-line @typescript-eslint/no-unsafe-argument
    useEvent_shouldNotBeInvokedBeforeMount as any,
  );
  useInsertionEffect(() => {
    latestRef.current = callback;
  }, [callback]);

  // Create a stable callback that always calls the latest callback:
  // using useRef instead of useCallback avoids creating and empty array on every render
  const stableRef = React.useRef<TCallback>();
  if (!stableRef.current) {
    stableRef.current = function (this: any) {
      // eslint-disable-next-line @typescript-eslint/no-unsafe-return, prefer-rest-params, @typescript-eslint/no-unsafe-argument
      return latestRef.current.apply(this, arguments as any);
    } as TCallback;
  }

  return stableRef.current;
}

/**
 * Render methods should be pure, especially when concurrency is used,
 * so we will throw this error if the callback is called while rendering.
 */
function useEvent_shouldNotBeInvokedBeforeMount() {
  throw new Error(
    "INVALID_USEEVENT_INVOCATION: the callback from useEvent cannot be invoked before the component has mounted.",
  );
}
