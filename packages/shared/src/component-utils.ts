import type { CSSProperties, ReactNode } from "react";
import type { JSX } from "solid-js/jsx-runtime";

import type { ExpandedRouteConfig } from "./types";
import { objectKeys } from "./utils";

export const generateMimeTypes = (fileTypes: string[]) => {
  const accepted = fileTypes.map((type) => {
    if (type === "blob") return "blob";
    if (type === "pdf") return "application/pdf";
    if (type.includes("/")) return type;
    else return `${type}/*`;
  });

  if (accepted.includes("blob")) {
    return undefined;
  }
  return accepted;
};

export const generateClientDropzoneAccept = (fileTypes: string[]) => {
  const mimeTypes = generateMimeTypes(fileTypes);

  if (!mimeTypes) return undefined;

  return Object.fromEntries(mimeTypes.map((type) => [type, []]));
};

/**
 * Shared helpers for our premade components that's reusable by multiple frameworks
 */

export const generatePermittedFileTypes = (config?: ExpandedRouteConfig) => {
  const fileTypes = config ? objectKeys(config) : [];

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

  const allowedTypes = objectKeys(config);

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

type AnyRuntime = "react" | "solid" | "svelte";
type MinCallbackArg = { __runtime: AnyRuntime };
type inferRuntime<T extends MinCallbackArg> = T["__runtime"] extends "react"
  ? "react"
  : T["__runtime"] extends "solid"
    ? "solid"
    : T["__runtime"] extends "svelte"
      ? "svelte"
      : never;

type ElementEsque<TRuntime extends AnyRuntime> = TRuntime extends "react"
  ? ReactNode
  : JSX.Element;
type CSSPropertiesEsque<TRuntime extends AnyRuntime> = TRuntime extends "react"
  ? CSSProperties
  : TRuntime extends "solid"
    ? JSX.CSSProperties
    : TRuntime extends "svelte"
      ? string
      : never;

export type StyleField<
  CallbackArg extends MinCallbackArg,
  TRuntime extends AnyRuntime = inferRuntime<CallbackArg>,
> =
  | string
  | CSSPropertiesEsque<TRuntime>
  | ((
      arg: Omit<CallbackArg, "__runtime">,
    ) => string | CSSPropertiesEsque<TRuntime>);

export type ContentField<
  CallbackArg extends MinCallbackArg,
  TRuntime extends AnyRuntime = inferRuntime<CallbackArg>,
> =
  | ElementEsque<TRuntime>
  | ((arg: Omit<CallbackArg, "__runtime">) => ElementEsque<TRuntime>);

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
