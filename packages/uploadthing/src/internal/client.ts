import type { CSSProperties, ReactNode } from "react";
import type { JSX } from "solid-js/jsx-runtime";

import type { ExpandedRouteConfig } from "@uploadthing/shared";

export const generatePermittedFileTypes = (config?: ExpandedRouteConfig) => {
  const fileTypes = config ? Object.keys(config) : [];

  const maxFileCount = config
    ? Object.values(config).map((v) => v.maxFileCount)
    : [];

  return { fileTypes, multiple: maxFileCount.some((v) => v && v > 1) };
};

export const capitalizeStart = (str: string) => {
  return str.charAt(0).toUpperCase() + str.slice(1);
};

export const INTERNAL_doFormatting = (config?: ExpandedRouteConfig): string => {
  if (!config) return "";

  const allowedTypes = Object.keys(config) as (keyof ExpandedRouteConfig)[];

  const formattedTypes = allowedTypes.map((f) => (f === "blob" ? "file" : f));

  // Format multi-type uploader label as "Supports videos, images and files";
  if (formattedTypes.length > 1) {
    const lastType = formattedTypes.pop();
    return `${formattedTypes.join("s, ")} and ${lastType}s`;
  }

  // Single type uploader label
  const key = allowedTypes[0];
  const formattedKey = formattedTypes[0];

  const { maxFileSize, maxFileCount } = config[key]!;

  if (maxFileCount && maxFileCount > 1) {
    return `${formattedKey}s up to ${maxFileSize}, max ${maxFileCount}`;
  } else {
    return `${formattedKey} (${maxFileSize})`;
  }
};

export const allowedContentTextLabelGenerator = (
  config?: ExpandedRouteConfig,
): string => {
  return capitalizeStart(INTERNAL_doFormatting(config));
};

export const progressWidths: Record<number, string> = {
  0: "after:w-0",
  10: "after:w-[10%]",
  20: "after:w-[20%]",
  30: "after:w-[30%]",
  40: "after:w-[40%]",
  50: "after:w-[50%]",
  60: "after:w-[60%]",
  70: "after:w-[70%]",
  80: "after:w-[80%]",
  90: "after:w-[90%]",
  100: "after:w-[100%]",
};

type MinCallbackArg = { ready: boolean | (() => boolean) };
type inferRuntime<T extends MinCallbackArg> = T["ready"] extends boolean
  ? "react"
  : "solid";

type AnyRuntime = "react" | "solid";
type ElementEsque<TRuntime extends AnyRuntime> = TRuntime extends "react"
  ? ReactNode
  : JSX.Element;
type CSSPropertiesEsque<TRuntime extends AnyRuntime> = TRuntime extends "react"
  ? CSSProperties
  : JSX.CSSProperties;

export type StyleField<
  CallbackArg extends MinCallbackArg,
  TRuntime extends AnyRuntime = inferRuntime<CallbackArg>,
> =
  | string
  | CSSPropertiesEsque<TRuntime>
  | ((arg: CallbackArg) => string | CSSPropertiesEsque<TRuntime>);

export type ContentField<
  CallbackArg extends MinCallbackArg,
  TRuntime extends AnyRuntime = inferRuntime<CallbackArg>,
> = ElementEsque<TRuntime> | ((arg: CallbackArg) => ElementEsque<TRuntime>);

export const styleFieldToClassName = <T extends MinCallbackArg>(
  styleField: StyleField<T> | undefined,
  args: T,
) => {
  if (typeof styleField === "string") return styleField;
  if (typeof styleField === "function") {
    const result = styleField(args);

    if (typeof result === "string") return result;
  }

  return "";
};

export const styleFieldToCssObject = <T extends MinCallbackArg>(
  styleField: StyleField<T> | undefined,
  args: T,
) => {
  if (typeof styleField === "object") return styleField;
  if (typeof styleField === "function") {
    const result = styleField(args);

    if (typeof result === "object") return result;
  }

  return {};
};

export const contentFieldToContent = <T extends MinCallbackArg>(
  contentField: ContentField<T> | undefined,
  arg: T,
) => {
  if (!contentField) return null;
  if (typeof contentField !== "function") return contentField;
  if (typeof contentField === "function") {
    const result = contentField(arg);

    return result;
  }
};
