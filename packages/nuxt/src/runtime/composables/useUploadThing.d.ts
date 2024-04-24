import type { UploadRouter } from "#uploadthing-router";
export declare const useUploadThing: <TEndpoint extends keyof UploadRouter, TSkipPolling extends boolean = false>(endpoint: TEndpoint, opts?: import("@uploadthing/vue").UseUploadthingProps<UploadRouter, TEndpoint, TSkipPolling, false extends TSkipPolling ? import("uploadthing/types").inferEndpointOutput<UploadRouter[TEndpoint]> : null> | undefined) => {
    readonly startUpload: (...args: undefined extends import("uploadthing/types").inferEndpointInput<UploadRouter[TEndpoint]> ? [files: File[], input?: (import("uploadthing/types").inferEndpointInput<UploadRouter[TEndpoint]> & undefined) | undefined] : [files: File[], input: import("uploadthing/types").inferEndpointInput<UploadRouter[TEndpoint]>]) => Promise<import("uploadthing/types").ClientUploadedFileData<import("uploadthing/types").inferEndpointOutput<UploadRouter[TEndpoint]>>[] | undefined>;
    readonly isUploading: import("vue").Ref<boolean>;
    readonly permittedFileInfo: import("vue").ComputedRef<{
        slug: string;
        config: import("@uploadthing/shared").ExpandedRouteConfig;
    } | undefined>;
};
