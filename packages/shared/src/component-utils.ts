import type { CSSProperties, ReactNode } from "react";
import type { JSX } from "solid-js/jsx-runtime";
import type { RenderFunction, StyleValue } from "vue";

/**
 * Use granular imports to better tree-shake
 * We don't need all the types, and `/application`
 * entrypoint is ~7k gzip which we can shave off
 */
import { audio } from "@uploadthing/mime-types/audio";
import { image } from "@uploadthing/mime-types/image";
import { text } from "@uploadthing/mime-types/text";
import { video } from "@uploadthing/mime-types/video";

import type { ExpandedRouteConfig } from "./types";
import { objectKeys } from "./utils";

export const generateMimeTypes = (
  typesOrRouteConfig: string[] | ExpandedRouteConfig,
) => {
  const fileTypes = Array.isArray(typesOrRouteConfig)
    ? typesOrRouteConfig
    : objectKeys(typesOrRouteConfig);
  if (fileTypes.includes("blob")) return [];

  return fileTypes.map((type) => {
    if (type === "pdf") return "application/pdf";
    if (type.includes("/")) return type;

    // Add wildcard to support all subtypes, e.g. image => "image/*"
    // But some browsers/OSes don't support it, so we'll also dump all the mime types
    // we know that starts with the type, e.g. image => "image/png, image/jpeg, ..."
    if (type === "audio") return ["audio/*", ...objectKeys(audio)].join(", ");
    if (type === "image") return ["image/*", ...objectKeys(image)].join(", ");
    if (type === "text") return ["text/*", ...objectKeys(text)].join(", ");
    if (type === "video") return ["video/*", ...objectKeys(video)].join(", ");

    return `${type}/*`;
  });
};

export const generateClientDropzoneAccept = (fileTypes: string[]) => {
  const mimeTypes = generateMimeTypes(fileTypes);
  return Object.fromEntries(mimeTypes.map((type) => [type, []]));
};

export function getFilesFromClipboardEvent(event: ClipboardEvent) {
  const dataTransferItems = event.clipboardData?.items;
  if (!dataTransferItems) return;

  const files = Array.from(dataTransferItems).reduce<File[]>((acc, curr) => {
    const f = curr.getAsFile();
    return f ? [...acc, f] : acc;
  }, []);

  return files;
}

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

  const { maxFileSize, maxFileCount, minFileCount } = config[key]!;

  if (maxFileCount && maxFileCount > 1) {
    if (minFileCount > 1) {
      return `${minFileCount} - ${maxFileCount} ${formattedKey}s up to ${maxFileSize}`;
    } else {
      return `${formattedKey}s up to ${maxFileSize}, max ${maxFileCount}`;
    }
  } else {
    return `${formattedKey} (${maxFileSize})`;
  }
};

export const allowedContentTextLabelGenerator = (
  config?: ExpandedRouteConfig,
): string => {
  return capitalizeStart(INTERNAL_doFormatting(config));
};

type AnyRuntime = "react" | "solid" | "svelte" | "vue";
type MinCallbackArg = { __runtime: AnyRuntime };
type inferRuntime<T extends MinCallbackArg> = T["__runtime"] extends "react"
  ? "react"
  : T["__runtime"] extends "solid"
    ? "solid"
    : T["__runtime"] extends "svelte"
      ? "svelte"
      : T["__runtime"] extends "vue"
        ? "vue"
        : never;

type ElementEsque<TRuntime extends AnyRuntime> = TRuntime extends "react"
  ? ReactNode
  : TRuntime extends "solid"
    ? JSX.Element
    : ReturnType<RenderFunction>;
type CSSPropertiesEsque<TRuntime extends AnyRuntime> = TRuntime extends "react"
  ? CSSProperties
  : TRuntime extends "solid"
    ? JSX.CSSProperties
    : TRuntime extends "svelte"
      ? string
      : TRuntime extends "vue"
        ? StyleValue
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

export type ClassListMerger = (
  ...classes: (string | null | undefined | false)[]
) => string;
export const defaultClassListMerger: ClassListMerger = (...classes) => {
  return classes.filter(Boolean).join(" ");
};
