declare const _default: import("h3").EventHandler<import("h3").EventHandlerRequest, Promise<readonly ({
    readonly key: string;
    readonly fileName: string;
    readonly fileUrl: string;
    readonly pollingJwt: string;
    readonly pollingUrl: string;
    readonly contentDisposition: "inline" | "attachment";
    readonly customId: string | null;
    readonly fileType: import("@uploadthing/shared").FileRouterInputKey;
    readonly url: string;
    readonly fields: {
        readonly [x: string]: string;
    };
} | {
    readonly key: string;
    readonly fileName: string;
    readonly fileUrl: string;
    readonly pollingJwt: string;
    readonly pollingUrl: string;
    readonly contentDisposition: "inline" | "attachment";
    readonly customId: string | null;
    readonly fileType: import("@uploadthing/shared").FileRouterInputKey;
    readonly urls: readonly string[];
    readonly uploadId: string;
    readonly chunkSize: number;
    readonly chunkCount: number;
})[] | "OK" | {
    slug: never;
    config: import("@uploadthing/shared").ExpandedRouteConfig;
}[]>>;
export default _default;
