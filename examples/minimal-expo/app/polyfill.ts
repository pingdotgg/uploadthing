/**
 * @remarks If you're on Expo < 51 (or using a different engine than Hermes), you'll also need to polyfill TextEncoder.
 */
globalThis.TextDecoder = class TextDecoder {
  encoding = "utf-8";
  constructor() {}
  decode = (view?: AllowSharedBufferSource, options?: TextDecodeOptions) => {
    if (typeof view === "undefined") {
      return "";
    }

    const stream =
      typeof options !== "undefined" && "stream" in options
        ? options.stream
        : false;
    if (typeof stream !== "boolean") {
      throw new TypeError("stream option must be boolean");
    }

    if (!ArrayBuffer.isView(view)) {
      throw new TypeError("passed argument must be an array buffer view");
    } else {
      var arr = new Uint8Array(view.buffer, view.byteOffset, view.byteLength),
        charArr = new Array(arr.length);
      for (let i = 0; i < arr.length; i++) {
        charArr[i] = String.fromCharCode(arr[i]);
      }
      return decodeURIComponent(escape(charArr.join("")));
    }
  };
} as any;
