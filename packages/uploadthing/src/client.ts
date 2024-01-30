// Don't want to ship our logger to the client, keep size down
/* eslint-disable no-console */

import { Cause, Effect } from "effect";
import {
  ResponseEsque,
  safeParseJSON,
  UploadThingError,
  withExponentialBackoff,
} from "@uploadthing/shared";

import { UPLOADTHING_VERSION } from "./constants";
import { fetchEff } from "./effect-utils";
import type { UploadThingResponse } from "./internal/handler";
import { uploadPartWithProgress } from "./internal/multi-part";
import type {
  DistributiveOmit,
  FileRouter,
  inferEndpointInput,
  inferEndpointOutput,
  UTEvents,
} from "./internal/types";
import type { UTReporterError } from "./internal/ut-reporter";
import { resolveMaybeUrlArg } from "./internal/get-full-api-url";

import { createAPIRequestUrl, createUTReporter } from "./internal/ut-reporter";

/*

More Effect refactoring:

- Get rid of `Effect.promise`
  - Either by refactoring promises to be effects (all the way down) with proper error handling
  - Or use `Effect.tryPromise` instead with proper error handling
- 

*/

/**
 * @internal
 * Shared helpers for our premade components that's reusable by multiple frameworks
 */
export * from "./internal/component-theming";

type UploadFilesOptions<
  TRouter extends FileRouter,
  TEndpoint extends keyof TRouter,
> = {
  onUploadProgress?: ({
    file,
    progress,
  }: {
    file: string;
    progress: number;
  }) => void;
  onUploadBegin?: ({ file }: { file: string }) => void;

  files: File[];

  /**
   * URL to the UploadThing API endpoint
   * @example URL { http://localhost:3000/api/uploadthing }
   * @example URL { https://www.example.com/api/uploadthing }
   */
  url: URL;

  /**
   * The uploadthing package that is making this request
   * @example "@uploadthing/react"
   *
   * This is used to identify the client in the server logs
   */
  package: string;
} & (undefined extends inferEndpointInput<TRouter[TEndpoint]>
  ? // eslint-disable-next-line @typescript-eslint/ban-types
    {}
  : {
      input: inferEndpointInput<TRouter[TEndpoint]>;
    });

export const INTERNAL_DO_NOT_USE__fatalClientError = (e: Error) =>
  new UploadThingError({
    code: "INTERNAL_CLIENT_ERROR",
    message: "Something went wrong. Please report this to UploadThing.",
    cause: e,
  });

export type UploadFileResponse<TServerOutput> = {
  name: string;
  size: number;
  key: string;
  url: string;
  // Matches what's returned from the serverside `onUploadComplete` callback
  serverData: TServerOutput;
};

const DANGEROUS__uploadFiles_internal = <TRouter extends FileRouter, TEndpoint extends keyof TRouter >(
  endpoint: TEndpoint,
  opts: UploadFilesOptions<TRouter, TEndpoint>,
) =>
  Effect.gen(function* ($) {
    // Fine to use global fetch in browser
    const fetch = globalThis.fetch.bind(globalThis);
  
    const reportEventToUT = createUTReporter({
      endpoint: String(endpoint),
      url: opts?.url,
      package: opts.package,
      fetch,
    });

    // Get presigned URL for S3 upload
    const s3ConnectionRes_ = yield* $(
      fetchEff(
        fetch,
        createAPIRequestUrl({
          url: opts.url,
          slug: String(endpoint),
          actionType: "upload",
        }),
        {
          method: "POST",
          body: JSON.stringify({
            input: "input" in opts ? opts.input : null,
            files: opts.files.map((f) => ({ name: f.name, size: f.size })),
          }),
          // Express requires Content-Type to be explicitly set to parse body properly
          headers: {
            "Content-Type": "application/json",
          },
        },
      ),
    );

    if (!s3ConnectionRes_.ok) {
      const error = yield* $(
        Effect.promise(() => UploadThingError.fromResponse(s3ConnectionRes_)),
      );

      // return yield* $(error);

    }

    const jsonOrError = yield* $(
      safeParseJSONEff<UploadThingResponse>(s3ConnectionRes_),
    );
    if (jsonOrError instanceof Error) {
      return yield* $(
        new UploadThingError({
          code: "BAD_REQUEST",
          message: jsonOrError.message,
          cause: s3ConnectionRes_,
        }),
      );
    }

    const s3ConnectionRes = jsonOrError;

    // TODO is this still needed?
    // if (!s3ConnectionRes || !Array.isArray(s3ConnectionRes)) {
    //   throw new UploadThingError({
    //     code: "BAD_REQUEST",
    //     message: "No URL. How did you even get here?",
    //     cause: s3ConnectionRes,
    //   });
    // }

    // return yield* $(
    //   Effect.all(
    //     s3ConnectionRes.map((presigned) =>
    //       uploadFile(opts, presigned, reportEventToUT),
    //     ),
    //   ),
    // );
  });

type ReportEventToUT = <TEvent extends keyof UTEvents>(
  type: TEvent,
  payload: UTEvents[TEvent],
) => Effect.Effect<never, UTReporterError, boolean>;

const uploadFile = <TRouter extends FileRouter, TEndpoint extends keyof FileRouter>(
  opts: UploadFilesOptions<TRouter, TEndpoint>,
  presigned: UploadThingResponse[number],
  reportEventToUT: ReportEventToUT,
) =>
  Effect.gen(function* ($) {
    const file = opts.files.find((f) => f.name === presigned.fileName);

    if (!file) {
      console.error("No file found for presigned URL", presigned);
      return yield* $(
        new UploadThingError({
          code: "NOT_FOUND",
          message: "No file found for presigned URL",
          cause: `Expected file with name ${
            presigned.fileName
          } but got '${opts.files.join(",")}'`,
        }),
      );
    }

    const {
      presignedUrls,
      uploadId,
      chunkSize,
      contentDisposition,
      key,
      pollingUrl,
      pollingJwt,
    } = presigned;

    let uploadedBytes = 0;

    // let etags: { tag: string; partNumber: number }[];

    const innerEffect = (url: string, index: number) =>
      Effect.gen(function* ($) {
        const offset = chunkSize * index;
        const end = Math.min(offset + chunkSize, file.size);
        const chunk = file.slice(offset, end);

        const etag = yield* $(
          uploadPartWithProgressEff({
            url,
            chunk: chunk,
            contentDisposition,
            fileType: file.type,
            fileName: file.name,
            maxRetries: 10,
            onProgress: (delta) => {
              uploadedBytes += delta;
              const percent = (uploadedBytes / file.size) * 100;
              opts.onUploadProgress?.({ file: file.name, progress: percent });
            },
          }),
        );

        return { tag: etag, partNumber: index + 1 };
      });

    const etags = yield* $(
      Effect.all(presignedUrls.map(innerEffect)),
      Effect.tapErrorCause((error) =>
        reportEventToUT("failure", {
          fileKey: key,
          uploadId,
          fileName: file.name,
          s3Error: Cause.pretty(error).toString(),
        }),
      ),
    );

    // Tell the server that the upload is complete
    const uploadOk = yield* $(
      reportEventToUT("multipart-complete", {
        uploadId,
        fileKey: key,
        etags,
      }),
    );
    if (!uploadOk) {
      console.log("Failed to alert UT of upload completion");
      return yield* $(
        new UploadThingError({
          code: "UPLOAD_FAILED",
          message: "Failed to alert UT of upload completion",
        }),
      );
    }

    // // Poll for file data, this way we know that the client-side onUploadComplete callback will be called after the server-side version
    // yield* $(
    //   Effect.promise(() =>
    //     pollForFileData({
    //       url: pollingUrl,
    //       apiKey: null,
    //       sdkVersion: UPLOADTHING_VERSION,
    //     }),
    //   ),
    // );
    // wait a bit as it's unsreasonable to expect the server to be done by now
    yield* $(Effect.sleep(1000));

    const serverData =  yield* $(
    Effect.promise(()=>withExponentialBackoff(async () => {
      type PollingResponse =
        | {
            status: "done";
            callbackData: inferEndpointOutput<TRouter[TEndpoint]>;
          }
        | { status: "still waiting" };

      const res = await fetch(pollingUrl, {
        headers: { authorization: pollingJwt },
      }).then((r) => r.json() as Promise<PollingResponse>);

      // eslint-disable-next-line @typescript-eslint/no-unsafe-return
      return res.status === "done" ? res.callbackData : undefined;
    }))
    )

    return {
      name: file.name,
      size: file.size,
      key: presigned.key,

      serverData,
      url: "https://utfs.io/f/" + key,
    } satisfies UploadFileResponse<inferEndpointOutput<TRouter[TEndpoint]>>;
  });

export const DANGEROUS__uploadFiles = <TRouter extends FileRouter, TEndpoint extends keyof TRouter>(
  endpoint: TEndpoint,
  opts: UploadFilesOptions<TRouter, TEndpoint>,
) =>
  DANGEROUS__uploadFiles_internal(endpoint as string, opts).pipe(
    // TODO maybe find a better way to handle the UTReporterError instead of just dying
    Effect.catchTag("UTReporterError", (error) => Effect.die(error)),
    Effect.runPromise,
  );

// export const DANGEROUS__uploadFiles_old = async <TRouter extends FileRouter>(
//   opts: UploadFilesOptions<TRouter>,
// ) => {
//   const reportEventToUT = createUTReporter({
//     endpoint: String(opts.endpoint),
//     url: opts?.url,
//   });

//   // Get presigned URL for S3 upload
//   const s3ConnectionRes = await fetch(
//     createAPIRequestUrl({
//       url: opts.url,
//       slug: String(opts.endpoint),
//       actionType: "upload",
//     }),
//     {
//       method: "POST",
//       body: JSON.stringify({
//         files: opts.files.map((f) => ({ name: f.name, size: f.size })),
//         input: opts.input,
//       }),
//       // Express requires Content-Type to be explicitly set to parse body properly
//       headers: {
//         "Content-Type": "application/json",
//       },
//     },
//   ).then(async (res) => {
//     // check for 200 response
//     if (!res.ok) {
//       const error = await UploadThingError.fromResponse(res);
//       throw error;
//     }

//     const jsonOrError = await safeParseJSON<UploadThingResponse>(res);
//     if (jsonOrError instanceof Error) {
//       throw new UploadThingError({
//         code: "BAD_REQUEST",
//         message: jsonOrError.message,
//         cause: res,
//       });
//     }
//     return jsonOrError;
//   });

//   if (!s3ConnectionRes || !Array.isArray(s3ConnectionRes)) {
//     throw new UploadThingError({
//       code: "BAD_REQUEST",
//       message: "No URL. How did you even get here?",
//       cause: s3ConnectionRes,
//     });
//   }

//   const fileUploadPromises = s3ConnectionRes.map(async (presigned) => {
//     const file = opts.files.find((f) => f.name === presigned.fileName);

//     if (!file) {
//       console.error("No file found for presigned URL", presigned);
//       throw new UploadThingError({
//         code: "NOT_FOUND",
//         message: "No file found for presigned URL",
//         cause: `Expected file with name ${
//           presigned.fileName
//         } but got '${opts.files.join(",")}'`,
//       });
//     }

//     const {
//       presignedUrls,
//       uploadId,
//       chunkSize,
//       contentDisposition,
//       key,
//       pollingUrl,
//     } = presigned;

//     let uploadedBytes = 0;

//     let etags: { tag: string; partNumber: number }[];
//     try {
//       etags = await Promise.all(
//         presignedUrls.map(async (url, index) => {
//           const offset = chunkSize * index;
//           const end = Math.min(offset + chunkSize, file.size);
//           const chunk = file.slice(offset, end);

//           const etag = await uploadPartWithProgress({
//             url,
//             chunk: chunk,
//             contentDisposition,
//             fileType: file.type,
//             fileName: file.name,
//             maxRetries: 10,
//             onProgress: (delta) => {
//               uploadedBytes += delta;
//               const percent = (uploadedBytes / file.size) * 100;
//               opts.onUploadProgress?.({ file: file.name, progress: percent });
//             },
//           });

//           return { tag: etag, partNumber: index + 1 };
//         }),
//       );
//     } catch (error) {
//       await reportEventToUT("failure", {
//         fileKey: key,
//         uploadId,
//         fileName: file.name,
//         s3Error: (error as Error).toString(),
//       });
//       throw "unreachable"; // failure event will throw for us
//     }

//     // Tell the server that the upload is complete
//     const uploadOk = await reportEventToUT("multipart-complete", {
//       uploadId,
//       fileKey: key,
//       etags,
//     });
//     if (!uploadOk) {
//       console.log("Failed to alert UT of upload completion");
//       throw new UploadThingError({
//         code: "UPLOAD_FAILED",
//         message: "Failed to alert UT of upload completion",
//       });
//     }

//     // Poll for file data, this way we know that the client-side onUploadComplete callback will be called after the server-side version
//     await pollForFileData({
//       url: pollingUrl,
//       apiKey: null,
//       sdkVersion: UPLOADTHING_VERSION,
//     });

//     return {
//       name: file.name,
//       size: file.size,
//       key: presigned.key,
//       url: "https://utfs.io/f/" + key,
//     } satisfies UploadFileResponse;
//   });

//   return Promise.all(fileUploadPromises);
// };

export const genUploader = <TRouter extends FileRouter>(initOpts: {
  /**
   * URL to the UploadThing API endpoint
   * @example URL { /api/uploadthing }
   * @example URL { https://www.example.com/api/uploadthing }
   *
   * If relative, host will be inferred from either the `VERCEL_URL` environment variable or `window.location.origin`
   *
   * @default (VERCEL_URL ?? window.location.origin) + "/api/uploadthing"
   */
  url?: string | URL;

  /**
   * The uploadthing package that is making this request
   * @example "@uploadthing/react"
   *
   * This is used to identify the client in the server logs
   */
  package: string;
}) => {
  const url = resolveMaybeUrlArg(initOpts?.url);

  const utPkg = initOpts.package;

  return <TEndpoint extends keyof TRouter>(
    endpoint: TEndpoint,
    opts: DistributiveOmit<
      Parameters<typeof DANGEROUS__uploadFiles<TRouter, TEndpoint>>[1],
      "url"
    >,
  ) =>
    // eslint-disable-next-line @typescript-eslint/no-unsafe-argument
    DANGEROUS__uploadFiles<TRouter, TEndpoint>(endpoint, {
      ...opts,
      url,
      package: utPkg,
    } as any);
};

export const classNames = (...classes: (string | boolean)[]) => {
  return classes.filter(Boolean).join(" ");
};

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

// Returns a full URL to the dev's uploadthing endpoint
export function getFullApiUrl(maybeUrl?: string): URL {
  const base = (() => {
    if (typeof window !== "undefined") {
      return window.location.origin;
    }

    // eslint-disable-next-line @typescript-eslint/prefer-optional-chain
    if (typeof process !== "undefined" && process?.env?.VERCEL_URL) {
      return `https://${process.env.VERCEL_URL}`;
    }

    // @ts-expect-error - import meta is not defined in node
    // eslint-disable-next-line @typescript-eslint/no-unsafe-member-access
    if (import.meta.env?.VERCEL_URL) {
      // @ts-expect-error - import meta is not defined in node
      // eslint-disable-next-line @typescript-eslint/no-unsafe-member-access
      return `https://${import.meta.env.VERCEL_URL}`;
    }

    return "http://localhost:3000";
  })();

  try {
    const url = new URL(maybeUrl ?? "/api/uploadthing", base);
    if (url.pathname === "/") {
      url.pathname = "/api/uploadthing";
    }
    return url;
  } catch (err) {
    throw new Error(
      `Failed to parse '${maybeUrl}' as a URL. Make sure it's a valid URL or path`,
    );
  }
}

const safeParseJSONEff = <T>(res: ResponseEsque) =>
  Effect.promise<T | Error>(() => safeParseJSON<T>(res));

const uploadPartWithProgressEff = (
  opts: Parameters<typeof uploadPartWithProgress>[0],
  retryCount?: number,
) => Effect.promise(() => uploadPartWithProgress(opts, retryCount));

export { resolveMaybeUrlArg };
