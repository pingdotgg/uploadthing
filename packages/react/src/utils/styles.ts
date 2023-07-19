import type { StyleField, SpinnerField, ContentField } from "../types";

export const styleFieldToClassName = <T,>(
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

export const styleFieldToCssObject = <T,>(
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

export const spinnerFieldToElement = <T,>(
    spinnerField: SpinnerField<T> | undefined,
    args: T,
) => {
    if (typeof spinnerField === "function") {
        const result = spinnerField(args);

        return result;
    }

    return spinnerField;
};

export const contentFieldToContent = <T,>(
    contentField: ContentField<T> | undefined,
    arg: T,
) => {
    if (!contentField) return undefined;
    if (typeof contentField !== "function") return contentField;
    if (typeof contentField === "function") {
        const result = contentField(arg);

        return result;
    }
};