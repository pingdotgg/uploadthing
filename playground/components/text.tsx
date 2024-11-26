import Link from "next/link";
import cx from "clsx";

type HeadingProps = {
  level?: 1 | 2 | 3 | 4 | 5 | 6;
} & React.ComponentProps<"h1" | "h2" | "h3" | "h4" | "h5" | "h6">;

export function Heading({ className, level = 1, ...props }: HeadingProps) {
  const Element: `h${typeof level}` = `h${level}`;

  return (
    <Element
      {...props}
      className={cx(
        "text-2xl/8 font-semibold text-zinc-950 sm:text-xl/8",
        className,
      )}
    />
  );
}

export function Subheading({ className, level = 2, ...props }: HeadingProps) {
  const Element: `h${typeof level}` = `h${level}`;

  return (
    <Element
      {...props}
      className={cx(
        "text-base/7 font-semibold text-zinc-950 sm:text-sm/6",
        className,
      )}
    />
  );
}

export function Text({ className, ...props }: React.ComponentProps<"p">) {
  return (
    <p
      data-slot="text"
      {...props}
      className={cx("text-muted-zinc-950 text-base/6 sm:text-sm/6", className)}
    />
  );
}

export function TextLink({
  className,
  ...props
}: React.ComponentProps<typeof Link>) {
  return (
    <Link
      {...props}
      className={cx(
        "text-zinc-950 underline decoration-zinc-950/50 data-[hover]:decoration-zinc-950",
        className,
      )}
    />
  );
}

export function Strong({
  className,
  ...props
}: React.ComponentProps<"strong">) {
  return (
    <strong
      {...props}
      className={cx("text-foreground font-medium", className)}
    />
  );
}

export function Code({ className, ...props }: React.ComponentProps<"code">) {
  return (
    <code
      {...props}
      className={cx(
        "rounded border border-zinc-950/10 bg-zinc-950/[2.5%] px-0.5 text-sm font-medium text-zinc-950 sm:text-[0.8125rem]",
        className,
      )}
    />
  );
}
