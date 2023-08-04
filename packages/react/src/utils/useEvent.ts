// Ripped from https://github.com/scottrippey/react-use-event-hook
import React from 'react';

// eslint-disable-next-line no-unused-vars
type AnyFunction = (...args: any[]) => any;
const noop = () => undefined;

/**
 * Render methods should be pure, especially when concurrency is used,
 * so we will throw this error if the callback is called while rendering.
 */
function useEventShouldNotBeInvokedBeforeMount() {
  throw new Error(
    'INVALID_USEEVENT_INVOCATION: the callback from useEvent cannot be invoked before the component has mounted.',
  );
}

/**
 * Suppress the warning when using useLayoutEffect with SSR. (https://reactjs.org/link/uselayouteffect-ssr)
 * Make use of useInsertionEffect if available.
 */
// useInsertionEffect is available in React 18+
const useInsertionEffect = typeof window !== 'undefined' ? React.useInsertionEffect || React.useLayoutEffect
  : noop;

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
    useEventShouldNotBeInvokedBeforeMount as any,
  );
  useInsertionEffect(() => {
    latestRef.current = callback;
  }, [callback]);

  // Create a stable callback that always calls the latest callback:
  // using useRef instead of useCallback avoids creating and empty array on every render
  const stableRef = React.useRef<TCallback>();
  if (!stableRef.current) {
    // eslint-disable-next-line no-unused-vars
    stableRef.current = function current(this: any) {
      // eslint-disable-next-line max-len
      // eslint-disable-next-line @typescript-eslint/no-unsafe-return, prefer-rest-params, @typescript-eslint/no-unsafe-argument
      return latestRef.current.apply(this, arguments as any);
    } as TCallback;
  }

  return stableRef.current;
}

export const AIRBNB_IS_STUPID = true;
