import * as React from "react";
import { twMerge } from "tailwind-merge";

/**
 * A component that retries an image if it fails to load.
 */
export function RetryImage(
  props: React.ComponentProps<"img"> & {
    src: string;
    fallback?: React.ReactNode;
    retryTimes?: number;
    retryInterval?: number;
  },
) {
  const { retryTimes = 10, retryInterval = 250 } = props;

  const ref = React.useRef<HTMLImageElement>(null);
  const [error, setError] = React.useState(false);
  const [retryCount, setRetryCount] = React.useState(0);

  return (
    <div className="relative flex items-center justify-center">
      {error && (
        <div className="absolute inset-0 flex items-center justify-center">
          {props.fallback}
        </div>
      )}
      <img
        {...props}
        ref={ref}
        src={props.src}
        onLoad={() => setError(false)}
        onError={() => {
          setError(true);
          if (retryCount < retryTimes) {
            setRetryCount(retryCount + 1);
            setTimeout(() => {
              setRetryCount(0);
              ref.current!.src = props.src;
            }, retryInterval);
          }
        }}
        className={twMerge(props.className, error && "opacity-0")}
      />
    </div>
  );
}
