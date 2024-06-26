import { unsafeCoerce } from "effect/Function";
import * as Micro from "effect/Micro";

import type {
  ExpandedRouteConfig,
  FetchError,
  UploadThingError,
} from "@uploadthing/shared";
import {
  asArray,
  FetchContext,
  fetchEff,
  fileSizeToBytes,
  getTypeFromFileName,
  objectKeys,
  resolveMaybeUrlArg,
  UploadAbortedError,
} from "@uploadthing/shared";

import * as pkgJson from "../package.json";
import type { FileRouter, inferEndpointOutput } from "./internal/types";
import { uploadWithProgress } from "./internal/upload.browser";
import { createUTReporter } from "./internal/ut-reporter";
import type {
  ClientUploadedFileData,
  CreateUploadOptions,
  GenerateUploaderOptions,
  inferEndpointInput,
  NewPresignedUrl,
  UploadFilesOptions,
} from "./types";

export const version = pkgJson.version;

export {
  /** @public */
  generateClientDropzoneAccept,
  /** @public */
  generateMimeTypes,
  /** @public */
  generatePermittedFileTypes,
  /** @public */
  UploadAbortedError,
} from "@uploadthing/shared";

/**
 * Validate that a file is of a valid type given a route config
 * @public
 */
export const isValidFileType = (
  file: File,
  routeConfig: ExpandedRouteConfig,
): boolean =>
  Micro.runSync(
    getTypeFromFileName(file.name, objectKeys(routeConfig)).pipe(
      Micro.map((type) => file.type.includes(type)),
      Micro.orElseSucceed(() => false),
    ),
  );

/**
 * Validate that a file is of a valid size given a route config
 * @public
 */
export const isValidFileSize = (
  file: File,
  routeConfig: ExpandedRouteConfig,
): boolean =>
  Micro.runSync(
    getTypeFromFileName(file.name, objectKeys(routeConfig)).pipe(
      Micro.flatMap((type) => fileSizeToBytes(routeConfig[type]!.maxFileSize)),
      Micro.map((maxFileSize) => file.size <= maxFileSize),
      Micro.orElseSucceed(() => false),
    ),
  );

type Deferred<T> = {
  resolve: (value: T) => void;
  reject: (reason?: any) => void;
  ac: AbortController;
  promise: Promise<T>;
};
const createDeferred = <T>(): Deferred<T> => {
  let resolve!: (value: T) => void;
  let reject!: (reason?: any) => void;
  const ac = new AbortController();
  const promise = new Promise<T>((res, rej) => {
    resolve = res;
    reject = rej;
  });
  return { promise, ac, resolve, reject };
};

/**
 * Generate a typed uploader for a given FileRouter
 * @public
 */
export const genUploader = <TRouter extends FileRouter>(
  initOpts: GenerateUploaderOptions,
) => {
  const controllableUpload = async <
    TEndpoint extends keyof TRouter,
    TServerOutput = inferEndpointOutput<TRouter[TEndpoint]>,
  >(
    slug: TEndpoint,
    opts: Omit<
      CreateUploadOptions<TRouter, TEndpoint>,
      keyof GenerateUploaderOptions
    >,
  ) => {
    const uploads = new Map<
      File,
      {
        presigned: NewPresignedUrl;
        deferred: Deferred<ClientUploadedFileData<TServerOutput>>;
      }
    >();

    const utReporter = createUTReporter({
      endpoint: String(slug),
      package: initOpts.package,
      url: resolveMaybeUrlArg(initOpts?.url),
      headers: opts.headers,
    });

    const presigneds = await Micro.runPromise(
      utReporter("upload", {
        // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment
        input: "input" in opts ? (opts.input as any) : null,
        files: opts.files.map((f) => ({
          name: f.name,
          size: f.size,
          type: f.type,
          lastModified: f.lastModified,
        })),
      }).pipe(Micro.provideService(FetchContext, window.fetch)),
    );

    const totalSize = opts.files.reduce((acc, f) => acc + f.size, 0);
    let totalLoaded = 0;

    const uploadEffect = (file: File, presigned: NewPresignedUrl) =>
      uploadFile(file, presigned, {
        onUploadProgress: (progressEvent) => {
          totalLoaded += progressEvent.delta;
          opts.onUploadProgress?.({
            ...progressEvent,
            file,
            progress: Math.round((progressEvent.loaded / file.size) * 100),
            totalLoaded,
            totalProgress: Math.round((totalLoaded / totalSize) * 100),
          });
        },
      }).pipe(Micro.provideService(FetchContext, window.fetch));

    for (const [i, p] of presigneds.entries()) {
      const file = opts.files[i];

      const deferred = createDeferred<ClientUploadedFileData<TServerOutput>>();
      uploads.set(file, { deferred, presigned: p });

      void Micro.runPromiseResult(uploadEffect(file, p), {
        signal: deferred.ac.signal,
      })
        .then((result) => {
          if (result._tag === "Right") {
            return deferred.resolve(result.right);
          } else if (result.left._tag === "Aborted") {
            throw new UploadAbortedError();
          }
          throw Micro.failureSquash(result.left);
        })
        .catch((err) => {
          if (err instanceof UploadAbortedError) return;
          deferred.reject(err);
        });
    }

    /**
     * Pause an ongoing upload
     * @param file The file upload you want to pause. Can be omitted to pause all files
     */
    const pauseUpload = (file?: File) => {
      const files = asArray(file ?? opts.files);
      for (const file of files) {
        const upload = uploads.get(file);
        if (!upload) return;

        if (upload.deferred.ac.signal.aborted) {
          // Cancel the upload if it's already been paused
          throw new UploadCancelledError();
        }

        upload.deferred.ac.abort();
      }
    };

    /**
     * Resume a paused upload
     * @param file The file upload you want to resume. Can be omitted to resume all files
     */
    const resumeUpload = (file?: File) => {
      const files = asArray(file ?? opts.files);
      for (const file of files) {
        const upload = uploads.get(file);
        if (!upload) throw "No upload found";

        upload.deferred.ac = new AbortController();
        void Micro.runPromiseResult(uploadEffect(file, upload.presigned), {
          signal: upload.deferred.ac.signal,
        })
          .then((result) => {
            if (result._tag === "Right") {
              return upload.deferred.resolve(result.right);
            } else if (result.left._tag === "Aborted") {
              throw new UploadAbortedError();
            }
            throw Micro.failureSquash(result.left);
          })
          .catch((err) => {
            if (err instanceof UploadAbortedError) return;
            upload.deferred.reject(err);
          });
      }
    };

    /**
     * Wait for an upload to complete
     * @param file The file upload you want to wait for. Can be omitted to wait for all files
     */
    const done = async <T extends File | void = void>(
      file?: T,
    ): Promise<
      T extends File
        ? ClientUploadedFileData<TServerOutput>
        : ClientUploadedFileData<TServerOutput>[]
    > => {
      const promises = [];

      const files = asArray(file ?? opts.files);
      for (const file of files) {
        const upload = uploads.get(file);
        if (!upload) throw "No upload found";

        promises.push(upload.deferred.promise);
      }

      const results = await Promise.all(promises);
      return (file ? results[0] : results) as never;
    };

    return { pauseUpload, resumeUpload, done };
  };

  /**
   * One step upload function that both requests presigned URLs
   * and then uploads the files to UploadThing
   */
  const typedUploadFiles = <TEndpoint extends keyof TRouter>(
    endpoint: TEndpoint,
    opts: Omit<
      UploadFilesOptions<TRouter, TEndpoint>,
      keyof GenerateUploaderOptions
    >,
  ) =>
    uploadFilesInternal<TRouter, TEndpoint>(endpoint, {
      ...opts,
      skipPolling: {} as never, // Remove in a future version, it's type right not is an ErrorMessage<T> to help migrations.
      url: resolveMaybeUrlArg(initOpts?.url),
      package: initOpts.package,
      // eslint-disable-next-line @typescript-eslint/no-unsafe-member-access
      input: (opts as any).input as inferEndpointInput<TRouter[TEndpoint]>,
    })
      .pipe(
        Micro.provideService(FetchContext, window.fetch),
        //
        (e) =>
          Micro.runPromiseResult(e, opts.signal ? { signal: opts.signal } : {}),
      )
      .then((result) => {
        if (result._tag === "Right") {
          return result.right;
        } else if (result.left._tag === "Aborted") {
          throw new UploadAbortedError();
        }
        throw Micro.failureSquash(result.left);
      });

  return { uploadFiles: typedUploadFiles, createUpload: controllableUpload };
};

/***
 * INTERNALS
 *   VVV
 */

export class UploadCancelledError extends Error {}

const uploadFilesInternal = <
  TRouter extends FileRouter,
  TEndpoint extends keyof TRouter,
  TServerOutput = inferEndpointOutput<TRouter[TEndpoint]>,
>(
  endpoint: TEndpoint,
  opts: UploadFilesOptions<TRouter, TEndpoint>,
): Micro.Micro<
  ClientUploadedFileData<TServerOutput>[],
  UploadThingError | FetchError,
  FetchContext
> => {
  // classic service right here
  const reportEventToUT = createUTReporter({
    endpoint: String(endpoint),
    package: opts.package,
    url: opts.url,
    headers: opts.headers,
  });

  const totalSize = opts.files.reduce((acc, f) => acc + f.size, 0);
  let totalLoaded = 0;

  return reportEventToUT("upload", {
    input: "input" in opts ? opts.input : null,
    files: opts.files.map((f) => ({
      name: f.name,
      size: f.size,
      type: f.type,
      lastModified: f.lastModified,
    })),
  }).pipe(
    Micro.flatMap((presigneds) =>
      Micro.forEach(
        presigneds,
        (presigned, i) =>
          uploadFile<TRouter, TEndpoint, TServerOutput>(
            opts.files[i],
            presigned,
            {
              onUploadProgress: (ev) => {
                totalLoaded += ev.delta;
                opts.onUploadProgress?.({
                  file: opts.files[i],
                  progress: Math.round((ev.loaded / opts.files[i].size) * 100),
                  loaded: ev.loaded,
                  delta: ev.delta,
                  totalLoaded,
                  totalProgress: Math.round((totalLoaded / totalSize) * 100),
                });
              },
            },
          ),
        { concurrency: 6 },
      ),
    ),
  );
};

const uploadFile = <
  TRouter extends FileRouter,
  TEndpoint extends keyof TRouter,
  TServerOutput = inferEndpointOutput<TRouter[TEndpoint]>,
>(
  file: File,
  presigned: NewPresignedUrl,
  opts: {
    onUploadProgress?: (progressEvent: {
      loaded: number;
      delta: number;
    }) => void;
  },
) =>
  fetchEff(presigned.url, { method: "HEAD" }).pipe(
    Micro.map(({ headers }) =>
      parseInt(headers.get("x-ut-range-start") ?? "0", 10),
    ),
    Micro.tap((start) =>
      opts.onUploadProgress?.({
        delta: start,
        loaded: start,
      }),
    ),
    Micro.flatMap((start) =>
      uploadWithProgress(file, start, presigned, (progressEvent) =>
        opts.onUploadProgress?.({
          delta: progressEvent.delta,
          loaded: progressEvent.loaded + start,
        }),
      ),
    ),
    Micro.map(
      unsafeCoerce<unknown, { url: string; serverData: TServerOutput }>,
    ),
    Micro.map((uploadResponse) => ({
      name: file.name,
      size: file.size,
      key: presigned.key,
      lastModified: file.lastModified,
      serverData: uploadResponse.serverData,
      url: uploadResponse.url,
      customId: presigned.customId,
      type: file.type,
    })),
  );
