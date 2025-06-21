import * as Array from "effect/Array";
import * as Micro from "effect/Micro";

import type { FetchEsque } from "@uploadthing/shared";
import {
  createIdentityProxy,
  FetchContext,
  resolveMaybeUrlArg,
  UploadAbortedError,
  UploadPausedError,
} from "@uploadthing/shared";

import * as pkgJson from "../package.json";
import type {
  AnyFile,
  FailedFile,
  PendingFile,
  UploadedFile,
  UploadFilesOptions,
} from "./_internal/client-future";
import {
  makePendingFile,
  requestPresignedUrls,
  uploadFile,
} from "./_internal/client-future";
import type { Deferred } from "./_internal/deferred";
import { createDeferred } from "./_internal/deferred";
import type {
  EndpointArg,
  FileRouter,
  GenerateUploaderOptions,
  inferEndpointInput,
  NewPresignedUrl,
  RouteRegistry,
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
  /** @public */
  UploadPausedError,
} from "@uploadthing/shared";

export * from "./_internal/client-future";

/**
 * Generate a typed uploader for a given FileRouter
 * @public
 * @remarks This API is not covered by semver
 */
export const future_genUploader = <TRouter extends FileRouter>(
  initOpts?: GenerateUploaderOptions,
) => {
  const routeRegistry = createIdentityProxy<RouteRegistry<TRouter>>();

  const controllableUpload = async <TEndpoint extends keyof TRouter>(
    slug: EndpointArg<TRouter, TEndpoint>,
    options: Omit<
      UploadFilesOptions<TRouter[TEndpoint]>,
      keyof GenerateUploaderOptions
    >,
  ) => {
    const endpoint = typeof slug === "function" ? slug(routeRegistry) : slug;
    const fetchFn: FetchEsque = initOpts?.fetch ?? window.fetch;

    const pExit = await requestPresignedUrls({
      endpoint: String(endpoint),
      files: options.files,
      url: resolveMaybeUrlArg(initOpts?.url),
      // eslint-disable-next-line @typescript-eslint/no-unsafe-member-access
      input: (options as any).input as inferEndpointInput<TRouter[TEndpoint]>,
      headers: options.headers,
    }).pipe(Micro.provideService(FetchContext, fetchFn), (effect) =>
      Micro.runPromiseExit(
        effect,
        options.signal && { signal: options.signal },
      ),
    );
    if (pExit._tag === "Failure") throw Micro.causeSquash(pExit.cause);
    const presigneds = pExit.value;
    const pendingFiles = options.files.map(makePendingFile);

    options.onEvent({
      type: "presigned-received",
      files: pendingFiles,
    });

    const uploads = new Map<
      File,
      {
        presigned: NewPresignedUrl;
        deferred: Deferred<AnyFile<TRouter[TEndpoint]>>;
      }
    >();

    const uploadEffect = (file: PendingFile, presigned: NewPresignedUrl) =>
      uploadFile(presigned.url, {
        file,
        files: pendingFiles,
        input: options.input,
        onEvent: options.onEvent,
        XHRImpl: globalThis.XMLHttpRequest,
      }).pipe(Micro.provideService(FetchContext, fetchFn));

    for (const [presigned, file] of Array.zip(presigneds, pendingFiles)) {
      file.key = presigned.key;
      file.customId = presigned.customId;

      const deferred = createDeferred<AnyFile<TRouter[TEndpoint]>>();
      uploads.set(file, { presigned, deferred });

      void Micro.runPromiseExit(uploadEffect(file, presigned), {
        signal: deferred.ac.signal,
      })
        .then((result) => {
          if (result._tag === "Success") {
            return deferred.resolve(result.value);
          } else if (result.cause._tag === "Interrupt") {
            throw new UploadPausedError();
          }
          throw Micro.causeSquash(result.cause);
        })
        .catch((err) => {
          if (err instanceof UploadPausedError) return;
          deferred.reject(err);
        });
    }

    /**
     * Pause an ongoing upload
     * @param file The file upload you want to pause. Can be omitted to pause all files
     */
    const pauseUpload = (file?: File) => {
      const files = Array.ensure(file ?? options.files);
      for (const file of files) {
        const upload = uploads.get(file);
        if (!upload) return;

        if (upload.deferred.ac.signal.aborted) {
          // Noop if it's already paused
          return;
        }

        upload.deferred.ac.abort();
      }
    };

    /**
     * Abort an upload
     * @param file The file upload you want to abort. Can be omitted to abort all files
     */
    const abortUpload = (file?: File) => {
      const files = Array.ensure(file ?? options.files);
      for (const file of files) {
        const upload = uploads.get(file);
        if (!upload) throw "No upload found";

        if (upload.deferred.ac.signal.aborted === false) {
          // Ensure the upload is paused
          upload.deferred.ac.abort();
        }
      }

      // Abort the upload
      throw new UploadAbortedError();
    };

    /**
     * Resume a paused upload
     * @param file The file upload you want to resume. Can be omitted to resume all files
     */
    const resumeUpload = (file?: File) => {
      const files = Array.ensure(file ?? options.files);
      for (const file of files) {
        const upload = uploads.get(file);
        if (!upload) throw "No upload found";

        upload.deferred.ac = new AbortController();
        void Micro.runPromiseExit(
          uploadEffect(file as PendingFile, upload.presigned),
          {
            signal: upload.deferred.ac.signal,
          },
        )
          .then((result) => {
            if (result._tag === "Success") {
              return upload.deferred.resolve(result.value);
            } else if (result.cause._tag === "Interrupt") {
              throw new UploadPausedError();
            }
            throw Micro.causeSquash(result.cause);
          })
          .catch((err) => {
            if (err instanceof UploadPausedError) return;
            upload.deferred.reject(err);
          });
      }
    };

    /**
     * Wait for an upload to complete
     * @param file The file upload you want to wait for. Can be omitted to wait for all files
     */
    const done = async <T extends AnyFile<TRouter[TEndpoint]> | void = void>(
      file?: T,
    ): Promise<
      T extends AnyFile<TRouter[TEndpoint]>
        ? UploadedFile<TRouter[TEndpoint]> | FailedFile<TRouter[TEndpoint]>
        : (UploadedFile<TRouter[TEndpoint]> | FailedFile<TRouter[TEndpoint]>)[]
    > => {
      const promises = [];

      const files = Array.ensure(file ?? options.files);
      for (const file of files) {
        const upload = uploads.get(file);
        if (!upload) throw "No upload found";

        promises.push(upload.deferred.promise);
      }

      const results = await Promise.all(promises);
      return (file ? results[0] : results) as never;
    };

    return { pauseUpload, abortUpload, resumeUpload, done };
  };

  const uploadFiles = <TEndpoint extends keyof TRouter>(
    slug: EndpointArg<TRouter, TEndpoint>,
    opts: Omit<
      UploadFilesOptions<TRouter[TEndpoint]>,
      keyof GenerateUploaderOptions
    >,
  ) => controllableUpload(slug, opts).then((_) => _.done());

  return {
    uploadFiles,
    createUpload: controllableUpload,
    /**
     * Identity object that can be used instead of raw strings
     * that allows "Go to definition" in your IDE to bring you
     * to the backend definition of a route.
     */
    routeRegistry,
  };
};
