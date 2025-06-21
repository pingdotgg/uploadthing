export const randomHexString = (function () {
  const characters = "abcdef0123456789";
  const charactersLength = characters.length;
  return function (length: number) {
    let result = "";
    for (let i = 0; i < length; i++) {
      result += characters.charAt(Math.floor(Math.random() * charactersLength));
    }
    return result;
  };
})();

export type TraceHeaders = {
  b3: string;
  traceparent: string;
};

export const generateTraceHeaders = (): TraceHeaders => {
  const traceId = randomHexString(32);
  const spanId = randomHexString(16);
  const sampled = "01";

  return {
    b3: `${traceId}-${spanId}-${sampled}`,
    traceparent: `00-${traceId}-${spanId}-${sampled}`,
  };
};
