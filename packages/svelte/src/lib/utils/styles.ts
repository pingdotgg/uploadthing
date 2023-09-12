export type StyleField<CallbackArg> = string | ((arg: CallbackArg) => string);

export const styleFieldToString = <T>(
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
