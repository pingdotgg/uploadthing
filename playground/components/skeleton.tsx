import { cx } from "class-variance-authority";

export function Skeleton({
  className,
  children,
  loading = true,
  ...props
}: React.ComponentProps<"div"> & { loading?: boolean }) {
  if (!loading) return children;

  return (
    <div className="relative inline-block" role="status">
      <div
        className={cx(
          className,
          "absolute inset-0 animate-pulse rounded-md bg-gray-300",
        )}
        aria-hidden="true"
        {...props}
      />
      <div className="invisible" aria-hidden="true">
        {children}
      </div>
    </div>
  );
}
