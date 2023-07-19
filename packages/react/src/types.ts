import type { UploadThingError } from "@uploadthing/shared";
import type { CSSProperties, ReactNode } from "react";
import type { UploadFileType } from "uploadthing/client";
import type { FileRouter, inferErrorShape, inferEndpointInput } from "uploadthing/server";

export type StyleField<CallbackArg> =
    | string
    | CSSProperties
    | ((arg: CallbackArg) => string | CSSProperties);
export type SpinnerField<CallbackArg> =
    | JSX.Element
    | ((arg: CallbackArg) => JSX.Element);
export type ContentField<CallbackArg> =
    | ReactNode
    | ((arg: CallbackArg) => ReactNode);

export type UploadthingComponentProps<TRouter extends FileRouter> = {
    [TEndpoint in keyof TRouter]: {
        endpoint: TEndpoint;

        onUploadProgress?: (progress: number) => void;
        onClientUploadComplete?: (
            res?: Awaited<ReturnType<UploadFileType<TRouter>>>,
        ) => void;
        onUploadError?: (error: UploadThingError<inferErrorShape<TRouter>>) => void;
    } & (undefined extends inferEndpointInput<TRouter[TEndpoint]>
        ? {}
        : {
            input: inferEndpointInput<TRouter[TEndpoint]>;
        });
}[keyof TRouter];