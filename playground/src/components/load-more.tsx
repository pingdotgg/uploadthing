"use client";

/**
 * Shamlessly stolen from Gabriel
 * @see https://github.com/gabrielelpidio/next-infinite-scroll-server-actions/blob/main/src/components/loadMore.tsx
 */
import * as React from "react";
import { twMerge } from "tailwind-merge";

import { LoadingDots } from "./ui/loading";

type LoadMoreAction = (
  offset: number,
) => Promise<readonly [React.ReactNode, number | null]>;

const LoadMore = ({
  children,
  initialOffset,
  loadMoreAction,
}: React.PropsWithChildren<{
  initialOffset: number;
  loadMoreAction: LoadMoreAction;
}>) => {
  const ref = React.useRef<HTMLDivElement>(null);
  const [elements, setElements] = React.useState([] as React.ReactNode[]);

  const currentOffset = React.useRef<number | null>(initialOffset);
  const [loading, setLoading] = React.useState(false);

  const loadMore = React.useCallback(
    async (abortController?: AbortController) => {
      if (currentOffset.current === null) return;

      setLoading(true);
      loadMoreAction(currentOffset.current)
        .then(([node, next]) => {
          if (abortController?.signal.aborted) return;

          setElements((prev) => [...prev, node]);
          currentOffset.current = next;
        })
        .catch(() => {})
        .finally(() => setLoading(false));
    },
    [loadMoreAction],
  );

  React.useEffect(() => {
    const signal = new AbortController();

    const element = ref.current;

    const observer = new IntersectionObserver(([entry]) => {
      if (entry?.isIntersecting && !loading) {
        loadMore(signal);
      }
    });

    if (element) {
      observer.observe(element);
    }

    return () => {
      signal.abort();
      if (element) {
        observer.unobserve(element);
      }
    };
  }, [loadMore]);

  return (
    <>
      <div className="relative grid grid-cols-1 gap-4 pt-12 md:grid-cols-2">
        {children}
        {elements}
      </div>
      <div
        ref={ref}
        className={twMerge(
          "bg-muted mt-4 flex w-full items-center justify-center rounded p-4",
          loading && "animate-pulse",
        )}
      >
        {currentOffset.current === null && (
          <span className="text-sm">No more files</span>
        )}
        {loading && <LoadingDots />}
      </div>
    </>
  );
};

export { LoadMore };
