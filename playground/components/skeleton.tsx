import React from "react";

export function Skeleton({
  className,
  children,
  loading = true,
  ...props
}: React.ComponentProps<"div"> & { loading?: boolean }) {
  if (!loading) return children;

  return (
    <div className="relative inline-block">
      <div
        className={
          "absolute inset-0 animate-pulse rounded-md bg-gray-300 " + className
        }
        {...props}
      />
      <div className="invisible">{children}</div>
    </div>
  );
}
