import type { CSSProperties, ReactNode } from "react";

export type StyleField<CallbackArg> =
  | string
  | CSSProperties
  | ((arg: CallbackArg) => string | CSSProperties);
export type ContentField<CallbackArg> =
  | ReactNode
  | ((arg: CallbackArg) => ReactNode);

export const styleFieldToClassName = <T>(
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

export const styleFieldToCssObject = <T>(
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

export const contentFieldToContent = <T>(
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
