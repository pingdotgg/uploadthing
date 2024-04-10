import { defineComponent, onMounted, onUnmounted } from "vue";

export const usePaste = (callback: (e: ClipboardEvent) => void) => {
  onMounted(() => {
    document.addEventListener("paste", callback);
  });
  onUnmounted(() => {
    document.removeEventListener("paste", callback);
  });
};

export const Spinner = defineComponent(() => {
  return () => {
    return (
      <svg
        class="block h-5 w-5 animate-spin align-middle text-white"
        xmlns="http://www.w3.org/2000/svg"
        fill="none"
        viewBox="0 0 576 512"
      >
        <path
          fill="currentColor"
          d="M256 32C256 14.33 270.3 0 288 0C429.4 0 544 114.6 544 256C544 302.6 531.5 346.4 509.7 384C500.9 399.3 481.3 404.6 465.1 395.7C450.7 386.9 445.5 367.3 454.3 351.1C470.6 323.8 480 291 480 255.1C480 149.1 394 63.1 288 63.1C270.3 63.1 256 49.67 256 31.1V32z"
        />
      </svg>
    );
  };
});

export const progressWidths: Record<number, string> = {
  0: "after:w-0",
  10: "after:w-[10%]",
  20: "after:w-[20%]",
  30: "after:w-[30%]",
  40: "after:w-[40%]",
  50: "after:w-[50%]",
  60: "after:w-[60%]",
  70: "after:w-[70%]",
  80: "after:w-[80%]",
  90: "after:w-[90%]",
  100: "after:w-[100%]",
};
