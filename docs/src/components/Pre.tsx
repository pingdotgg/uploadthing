import type { ComponentProps, ReactElement } from "react";
import { useCallback, useRef } from "react";
import { Button, CopyToClipboard } from "nextra/components";
import { WordWrapIcon } from "nextra/icons";

import { Javascript, Json, Typescript } from "./icons";

function cn(...classes: Array<string | boolean | undefined>) {
  return classes.filter(Boolean).join(" ");
}

export const Pre = ({
  children,
  className,
  hasCopyCode,
  filename,
  ...props
}: ComponentProps<"pre"> & {
  filename?: string;
  hasCopyCode?: boolean;
  "data-language"?: string;
}): ReactElement => {
  const preRef = useRef<HTMLPreElement | null>(null);

  const toggleWordWrap = useCallback(() => {
    const htmlDataset = document.documentElement.dataset;
    const hasWordWrap = "nextraWordWrap" in htmlDataset;
    if (hasWordWrap) {
      delete htmlDataset.nextraWordWrap;
    } else {
      htmlDataset.nextraWordWrap = "";
    }
  }, []);

  const language = props["data-language"] ?? "";
  const Icon = {
    js: Javascript,
    jsx: Javascript,
    ts: Typescript,
    tsx: Typescript,
    json: Json,
  }[language];

  return (
    <div className="nextra-code-block nx-relative nx-mt-6 first:nx-mt-0">
      {filename && (
        <>
          <div className="nx-absolute nx-flex nx-justify-between nx-items-center nx-top-0 nx-z-[1] nx-w-full nx-truncate nx-rounded-t-xl nx-bg-primary-700/5 nx-py-2 nx-px-4 nx-text-xs nx-text-gray-700 dark:nx-bg-primary-300/10 dark:nx-text-gray-200">
            <div className="nx-flex nx-w-full nx-items-center nx-gap-2">
              {Icon && <Icon />}
              <div>{filename}</div>
            </div>
            {hasCopyCode && (
              <CopyToClipboard
                getValue={() =>
                  preRef.current?.querySelector("code")?.textContent || ""
                }
              />
            )}
          </div>
        </>
      )}
      <pre
        className={cn(
          "nx-bg-primary-700/5 nx-mb-4 nx-overflow-x-auto nx-rounded-xl nx-font-medium nx-subpixel-antialiased dark:nx-bg-primary-300/10 nx-text-[.9em]",
          "contrast-more:nx-border contrast-more:nx-border-primary-900/20 contrast-more:nx-contrast-150 contrast-more:dark:nx-border-primary-100/40",
          filename ? "nx-pt-12 nx-pb-4" : "nx-py-4",
          className,
        )}
        ref={preRef}
        {...props}
      >
        {children}
      </pre>
      <div
        className={cn(
          "nx-opacity-0 nx-transition [div:hover>&]:nx-opacity-100 focus-within:nx-opacity-100",
          "nx-flex nx-gap-1 nx-absolute nx-m-[11px] nx-right-0",
          filename ? "nx-top-8" : "nx-top-0",
        )}
      >
        <Button
          onClick={toggleWordWrap}
          className="md:nx-hidden"
          title="Toggle word wrap"
        >
          <WordWrapIcon className="nx-pointer-events-none nx-h-4 nx-w-4" />
        </Button>
        {hasCopyCode && !filename && (
          <CopyToClipboard
            getValue={() =>
              preRef.current?.querySelector("code")?.textContent || ""
            }
          />
        )}
      </div>
    </div>
  );
};
