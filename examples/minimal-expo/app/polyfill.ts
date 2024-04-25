// FIXME: Remove polyfills when Expo SDK 51 drops which has TextEncoder and TextDecoder built-in
globalThis.TextEncoder = class TextEncoder {
  encoding = "utf-8";
  constructor() {}
  encode = (str: string) => {
    if (typeof str !== "string") {
      throw new TypeError("passed argument must be of tye string");
    }
    var binstr = unescape(encodeURIComponent(str)),
      arr = new Uint8Array(binstr.length);
    const split = binstr.split("");
    for (let i = 0; i < split.length; i++) {
      arr[i] = split[i].charCodeAt(0);
    }
    return arr;
  };
} as any;
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
