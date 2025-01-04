import { ref, watch } from "vue";

type AnyFunction = (...args: any[]) => any;

export function useEvent<TCallback extends AnyFunction>(callback: TCallback) {
  const callbackRef = ref(callback);

  // Watch the callbackRef and create a stable reference
  watch(callbackRef, () => {
    // noop
  });

  return callbackRef.value;
}
