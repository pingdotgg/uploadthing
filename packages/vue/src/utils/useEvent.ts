import { onMounted, ref, watch } from "vue";

type AnyFunction = (...args: any[]) => any;

export function useEvent<TCallback extends AnyFunction>(callback: TCallback) {
  const callbackRef = ref(callback);

  // Watch the callbackRef and create a stable reference
  watch(callbackRef, () => {});

  // Throw an error if the callback is invoked before mounting
  onMounted(() => {
    if (callbackRef.value === null) {
      throw new Error(
        "INVALID_USE_EVENT_INVOCATION: The callback from useEvent cannot be invoked before the component has mounted.",
      );
    }
  });

  return callbackRef.value;
}
