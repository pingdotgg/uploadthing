"use client";

import { useEffect, useRef } from "react";
import { useSectionStore } from "@/components/SectionProvider";
import { Tag, TagColor } from "@/components/Tag";
import { remToPx } from "@/lib/remToPx";
import { useInView } from "framer-motion";
import { Link } from "next-view-transitions";

import { AnchorIcon } from "./icons";

function Eyebrow({
  tag,
  tagColor,
  label,
  since,
  deprecated,
}: {
  tag?: string;
  tagColor?: TagColor;
  label?: string;
  since?: string;
  deprecated?: boolean;
}) {
  if (!tag && !label && !since && !deprecated) {
    return null;
  }

  return (
    <div className="mt-3 flex items-center gap-x-3">
      {tag && <Tag color={tagColor}>{tag}</Tag>}
      {since && <Tag color="amber">{`Since ${since}`}</Tag>}
      {(tag || since) && label && (
        <span className="h-0.5 w-0.5 rounded-full bg-zinc-300 dark:bg-zinc-600" />
      )}
      {deprecated && <Tag color="red">{`DEPRECATED`}</Tag>}
      {label && (
        <span className="font-mono text-xs text-zinc-400">{label}</span>
      )}
    </div>
  );
}

function Anchor({
  id,
  inView,
  children,
}: {
  id: string;
  inView: boolean;
  children: React.ReactNode;
}) {
  return (
    <Link
      href={`#${id}`}
      className="group text-inherit no-underline hover:text-inherit"
    >
      {inView && (
        <div className="absolute ml-[calc(-1*var(--width))] mt-1 hidden w-[var(--width)] opacity-0 transition [--width:calc(2.625rem+0.5px+50%-min(50%,calc(theme(maxWidth.lg)+theme(spacing.8))))] group-hover:opacity-100 group-focus:opacity-100 md:block lg:z-50 2xl:[--width:theme(spacing.10)]">
          <div className="group/anchor block h-5 w-5 rounded-lg bg-zinc-50 ring-1 ring-inset ring-zinc-300 transition hover:ring-zinc-500 dark:bg-zinc-800 dark:ring-zinc-700 dark:hover:bg-zinc-700 dark:hover:ring-zinc-600">
            <AnchorIcon className="h-5 w-5 stroke-zinc-500 transition dark:stroke-zinc-400 dark:group-hover/anchor:stroke-white" />
          </div>
        </div>
      )}
      {children}
    </Link>
  );
}

export function Heading<Level extends 2 | 3>({
  children,
  tag,
  tagColor,
  since,
  label,
  deprecated,
  level,
  anchor = true,
  ...props
}: React.ComponentPropsWithoutRef<`h${Level}`> & {
  id: string;
  tag?: string;
  tagColor?: TagColor;
  since?: string;
  label?: string;
  deprecated?: boolean;
  level?: Level;
  anchor?: boolean;
}) {
  level = level ?? (2 as Level);
  let Component = `h${level}` as "h2" | "h3";
  let ref = useRef<HTMLHeadingElement>(null);
  let registerHeading = useSectionStore((s) => s.registerHeading);

  let inView = useInView(ref, {
    margin: `${remToPx(-3.5)}px 0px 0px 0px`,
    amount: "all",
  });

  useEffect(() => {
    registerHeading({
      id: props.id,
      ref,
      offsetRem: tag || label || since || deprecated ? 8 : 6,
    });
  }, []);

  return (
    <>
      {(tag || label || since || deprecated) && <div className="h-8 w-full" />}
      <Eyebrow
        tag={tag}
        tagColor={tagColor}
        label={label}
        since={since}
        deprecated={deprecated}
      />
      <Component
        ref={ref}
        className={
          tag || label || since || deprecated
            ? "mt-2 scroll-mt-32"
            : "scroll-mt-24"
        }
        {...props}
      >
        {anchor ? (
          <Anchor id={props.id} inView={inView}>
            {children}
          </Anchor>
        ) : (
          children
        )}
      </Component>
    </>
  );
}
