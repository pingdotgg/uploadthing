/* eslint-disable no-console -- Don't ship our logger to client, reduce size*/

import { Schema } from "@effect/schema";
import { Cause, Effect } from "effect";

import {
  exponentialBackoff,
  fetchEffJson,
  UploadThingError,
} from "@uploadthing/shared";

import { resolveMaybeUrlArg } from "./internal/get-full-api-url";
import { uploadPartWithProgress } from "./internal/multi-part";
import { uploadThingResponseSchema } from "./internal/shared-schemas";
import type {
  MPUResponse,
  PSPResponse,
  UploadThingResponse,
} from "./internal/shared-schemas";
import type {
  DistributiveOmit,
  FileRouter,
  inferEndpointInput,
  inferEndpointOutput,
  UTEvents,
} from "./internal/types";
import type { UTReporterError } from "./internal/ut-reporter";
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

const DANGEROUS__uploadFiles_internal = <
  TRouter extends FileRouter,
  TEndpoint extends keyof TRouter,
>(
  endpoint: TEndpoint,
  opts: UploadFilesOptions<TRouter, TEndpoint>,
) => {
  // Fine to use global fetch in browser
  const fetch = globalThis.fetch.bind(globalThis);
  const reportEventToUT = createUTReporter({
    endpoint: String(endpoint),
    url: opts?.url,
    package: opts.package,
    fetch,
  });

  return Effect.gen(function* ($) {
    const presigneds = yield* $(
      fetchEffJson(
        fetch,
        uploadThingResponseSchema,
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
          headers: { "Content-Type": "application/json" },
        },
      ),
    );

    return yield* $(
      Effect.all(presigneds.map((d) => uploadFile(opts, d, reportEventToUT))),
    );
  });
};

type ReportEventToUT = <TEvent extends keyof UTEvents>(
  type: TEvent,
  payload: UTEvents[TEvent],
) => Effect.Effect<never, UTReporterError, boolean>;

const uploadFile = <
  TRouter extends FileRouter,
  TEndpoint extends keyof TRouter,
>(
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

    opts.onUploadBegin?.({ file: file.name });
    if ("urls" in presigned) {
      yield* $(uploadMultipart(file, presigned, { reportEventToUT, ...opts }));
      // wait a bit as it's unsreasonable to expect the server to be done by now
      yield* $(Effect.sleep(500));
    } else {
      yield* $(uploadPresignedPost(file, presigned, { ...opts }));
    }

    const PollingResponse = Schema.union(
      Schema.struct({
        status: Schema.literal("done"),
        callbackData: Schema.any as Schema.Schema<
          never,
          inferEndpointOutput<TRouter[TEndpoint]>
        >,
      }),
      Schema.struct({ status: Schema.literal("still waiting") }),
    );

    const serverData = yield* $(
      // TODO: Figure out this lint error
      // eslint-disable-next-line no-restricted-globals
      fetchEffJson(fetch, PollingResponse, presigned.pollingUrl, {
        headers: { authorization: presigned.pollingJwt },
      }),
      Effect.andThen((res) =>
        res.status === "done"
          ? Effect.succeed(res.callbackData)
          : Effect.fail({ _tag: "NotDone" as const }),
      ),
      Effect.retry({
        while: (res) => res._tag === "NotDone",
        schedule: exponentialBackoff,
      }),
    );

    return {
      name: file.name,
      size: file.size,
      key: presigned.key,

      serverData,
      url: "https://utfs.io/f/" + presigned.key,
    } satisfies UploadFileResponse<inferEndpointOutput<TRouter[TEndpoint]>>;
  });

export const DANGEROUS__uploadFiles = <
  TRouter extends FileRouter,
  TEndpoint extends keyof TRouter,
>(
  endpoint: TEndpoint,
  opts: UploadFilesOptions<TRouter, TEndpoint>,
) =>
  DANGEROUS__uploadFiles_internal(endpoint, opts).pipe(
    // TODO maybe find a better way to handle the UTReporterError instead of just dying
    Effect.catchTag("UTReporterError", (error) => Effect.die(error)),
    Effect.tapErrorCause(Effect.logError),
    Effect.runPromise,
  );

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

const uploadPartWithProgressEff = (
  opts: Parameters<typeof uploadPartWithProgress>[0],
  retryCount?: number,
) => Effect.promise(() => uploadPartWithProgress(opts, retryCount));

export { resolveMaybeUrlArg };

function uploadMultipart(
  file: File,
  presigned: MPUResponse,
  opts: {
    reportEventToUT: ReturnType<typeof createUTReporter>;
    onUploadProgress?: UploadFilesOptions<any, any>["onUploadProgress"];
  },
) {
  let uploadedBytes = 0;

  const innerEffect = (url: string, index: number) =>
    Effect.gen(function* ($) {
      const offset = presigned.chunkSize * index;
      const end = Math.min(offset + presigned.chunkSize, file.size);
      const chunk = file.slice(offset, end);

      const etag = yield* $(
        uploadPartWithProgressEff({
          url,
          chunk: chunk,
          contentDisposition: presigned.contentDisposition,
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

  return Effect.gen(function* ($) {
    const etags = yield* $(
      Effect.all(presigned.urls.map(innerEffect)),
      Effect.tapErrorCause((error) =>
        opts.reportEventToUT("failure", {
          fileKey: presigned.key,
          uploadId: presigned.uploadId,
          fileName: file.name,
          s3Error: Cause.pretty(error).toString(),
        }),
      ),
    );

    // Tell the server that the upload is complete
    const uploadOk = yield* $(
      opts.reportEventToUT("multipart-complete", {
        uploadId: presigned.uploadId,
        fileKey: presigned.key,
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
  });
}

function uploadPresignedPost(
  file: File,
  presigned: PSPResponse,
  opts: {
    onUploadProgress?: UploadFilesOptions<any, any>["onUploadProgress"];
  },
) {
  return Effect.gen(function* ($) {
    const formData = new FormData();
    Object.entries(presigned.fields).forEach(([k, v]) => formData.append(k, v));
    formData.append("file", file); // File data **MUST GO LAST**

    const response = yield* $(
      Effect.promise(
        () =>
          new Promise<XMLHttpRequest>((resolve, reject) => {
            const xhr = new XMLHttpRequest();
            xhr.open("POST", presigned.url);
            xhr.setRequestHeader("Accept", "application/xml");
            xhr.upload.onprogress = (p) => {
              opts.onUploadProgress?.({
                file: file.name,
                progress: (p.loaded / p.total) * 100,
              });
            };
            xhr.onload = (e) => resolve(e.target as XMLHttpRequest);
            xhr.onerror = (e) => reject(e);
            xhr.send(formData);
          }),
      ),
    );

    if (response.status > 299 || response.status < 200) {
      throw new UploadThingError({
        code: "UPLOAD_FAILED",
        message: "Failed to upload file",
        cause: response,
      });
    }
  });
}
