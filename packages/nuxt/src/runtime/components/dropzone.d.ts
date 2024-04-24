import type { UploadRouter } from "#uploadthing-router";
declare const UploadDropzone: new <TEndpoint extends keyof UploadRouter, TSkipPolling extends boolean = false>(props: {
    config: import("@uploadthing/vue").UploadDropzoneProps<UploadRouter, TEndpoint, TSkipPolling>;
} & import("vue").VNodeProps & import("vue").AllowedComponentProps & import("vue").ComponentCustomProps) => import("vue").CreateComponentPublicInstance<{
    config: import("@uploadthing/vue").UploadDropzoneProps<UploadRouter, TEndpoint, TSkipPolling>;
}, {}, {}, {}, {}, import("vue").ComponentOptionsMixin, import("vue").ComponentOptionsMixin, {}, import("vue").PublicProps, {}, false, {}, {}, {
    P: {};
    B: {};
    D: {};
    C: {};
    M: {};
    Defaults: {};
}, {
    config: import("@uploadthing/vue").UploadDropzoneProps<UploadRouter, TEndpoint, TSkipPolling>;
}, {}, {}, {}, {}, {}>;
export default UploadDropzone;
