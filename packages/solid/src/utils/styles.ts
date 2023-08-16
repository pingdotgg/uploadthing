import type { JSX } from "solid-js/jsx-runtime";

export type StyleField<CallbackArg> =
  | string
  | JSX.CSSProperties
  | ((arg: CallbackArg) => string | JSX.CSSProperties);
export type ContentField<CallbackArg> =
  | JSX.Element
  | ((arg: CallbackArg) => JSX.Element);

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

  return contentField(arg);
};
