import {
  HttpClient,
  HttpClientRequest,
  HttpClientResponse,
} from "@effect/platform";
import * as S from "@effect/schema/Schema";
import * as Arr from "effect/Array";
import * as Effect from "effect/Effect";
import * as Layer from "effect/Layer";
import * as Predicate from "effect/Predicate";

import type {
  ACL,
  FetchEsque,
  MaybeUrl,
  SerializedUploadThingError,
} from "@uploadthing/shared";
import {
  asArray,
  parseTimeToSeconds,
  UploadThingError,
} from "@uploadthing/shared";

import {
  ApiUrl,
  configProvider,
  UPLOADTHING_VERSION,
  UTToken,
} from "../internal/config";
import { withLogFormat, withMinimalLogLevel } from "../internal/logger";
import type {
  ACLUpdateOptions,
  DeleteFilesOptions,
  FileEsque,
  GetFileUrlsOptions,
  GetSignedURLOptions,
  ListFilesOptions,
  RenameFileUpdate,
  UploadFileResult,
  UploadFilesOptions,
  UrlWithOverrides,
  UTApiOptions,
} from "./types";
import { UTFile } from "./ut-file";
import { downloadFiles, guardServerOnly, uploadFilesInternal } from "./utils";

export { UTFile };

export class UTApi {
  private fetch: FetchEsque;
  private defaultKeyType: "fileKey" | "customId";

  constructor(private opts?: UTApiOptions) {
    // Assert some stuff
    guardServerOnly();

    this.fetch = opts?.fetch ?? globalThis.fetch;
    this.defaultKeyType = opts?.defaultKeyType ?? "fileKey";
  }

  private requestUploadThing = <T>(
    pathname: `/${string}`,
    body: Record<string, unknown>,
    responseSchema: S.Schema<T, any>,
  ) =>
    Effect.gen(this, function* () {
      const { apiKey } = yield* UTToken;
      const baseUrl = yield* ApiUrl;
      const httpClient = yield* HttpClient.HttpClient;

      return yield* HttpClientRequest.post(pathname).pipe(
        HttpClientRequest.prependUrl(baseUrl),
        HttpClientRequest.unsafeJsonBody(body),
        HttpClientRequest.setHeaders({
          "x-uploadthing-version": UPLOADTHING_VERSION,
          "x-uploadthing-be-adapter": "server-sdk",
          "x-uploadthing-api-key": apiKey,
        }),
        HttpClient.filterStatusOk(httpClient),
        Effect.tapBoth({
          onSuccess: (res) =>
            Effect.logDebug(`UT Response`).pipe(
              Effect.annotateLogs("res", res),
            ),
          onFailure: (err) =>
            Effect.logError("UploadThing error").pipe(
              Effect.annotateLogs("error", err),
            ),
        }),
        HttpClientResponse.schemaBodyJsonScoped(responseSchema),
      );
    }).pipe(Effect.withLogSpan("utapi.#requestUploadThing"));

  private executeAsync = <A, E>(
    program: Effect.Effect<A, E, HttpClient.HttpClient.Default>,
    signal?: AbortSignal,
  ) => {
    const layer = Layer.provide(
      Layer.mergeAll(
        withLogFormat,
        withMinimalLogLevel,
        HttpClient.layer,
        Layer.succeed(HttpClient.Fetch, this.fetch as typeof globalThis.fetch),
      ),
      Layer.setConfigProvider(configProvider(this.opts)),
    );

    return program.pipe(
      Effect.provide(layer),
      Effect.withLogSpan("utapi.#executeAsync"),
      (e) => Effect.runPromise(e, signal ? { signal } : undefined),
    );
  };

  /**
   * Upload files to UploadThing storage.
   *
   * @example
   * await uploadFiles(new File(["foo"], "foo.txt"));
   *
   * @example
   * await uploadFiles([
   *   new File(["foo"], "foo.txt"),
   *   new File(["bar"], "bar.txt"),
   * ]);
   */
  uploadFiles(
    files: FileEsque,
    opts?: UploadFilesOptions,
  ): Promise<UploadFileResult>;
  uploadFiles(
    files: FileEsque[],
    opts?: UploadFilesOptions,
  ): Promise<UploadFileResult[]>;
  async uploadFiles(
    files: FileEsque | FileEsque[],
    opts?: UploadFilesOptions,
  ): Promise<UploadFileResult | UploadFileResult[]> {
    guardServerOnly();

    const uploads = await this.executeAsync(
      Effect.flatMap(
        uploadFilesInternal({
          files: asArray(files),
          contentDisposition: opts?.contentDisposition ?? "inline",
          acl: opts?.acl,
        }),
        (ups) => Effect.succeed(Array.isArray(files) ? ups : ups[0]),
      ).pipe(
        Effect.tap((res) =>
          Effect.logDebug("Finished uploading").pipe(
            Effect.annotateLogs("uploadResult", res),
          ),
        ),
        Effect.withLogSpan("uploadFiles"),
      ),
      opts?.signal,
    );
    return uploads;
  }

  /**
   * @param {string} url The URL of the file to upload
   * @param {Json} metadata JSON-parseable metadata to attach to the uploaded file(s)
   *
   * @example
   * await uploadFileFromUrl("https://uploadthing.com/f/2e0fdb64-9957-4262-8e45-f372ba903ac8_image.jpg");
   *
   * @example
   * await uploadFileFromUrl([
   *   "https://uploadthing.com/f/2e0fdb64-9957-4262-8e45-f372ba903ac8_image.jpg",
   *   "https://uploadthing.com/f/1649353b-04ea-48a2-9db7-31de7f562c8d_image2.jpg"
   * ])
   */
  uploadFilesFromUrl(
    urls: MaybeUrl | UrlWithOverrides,
    opts?: UploadFilesOptions,
  ): Promise<UploadFileResult>;
  uploadFilesFromUrl(
    urls: (MaybeUrl | UrlWithOverrides)[],
    opts?: UploadFilesOptions,
  ): Promise<UploadFileResult[]>;
  async uploadFilesFromUrl(
    urls: MaybeUrl | UrlWithOverrides | (MaybeUrl | UrlWithOverrides)[],
    opts?: UploadFilesOptions,
  ): Promise<UploadFileResult | UploadFileResult[]> {
    guardServerOnly();

    const downloadErrors: Record<number, SerializedUploadThingError> = {};
    const arr = asArray(urls);

    const program = Effect.gen(function* () {
      const downloadedFiles = yield* downloadFiles(arr, downloadErrors).pipe(
        Effect.map((files) => Arr.filter(files, Predicate.isNotNullable)),
      );

      yield* Effect.logDebug(
        `Downloaded ${downloadedFiles.length}/${arr.length} files`,
      ).pipe(Effect.annotateLogs("downloadedFiles", downloadedFiles));

      const uploads = yield* uploadFilesInternal({
        files: downloadedFiles,
        contentDisposition: opts?.contentDisposition ?? "inline",
        acl: opts?.acl,
      });

      /** Put it all back together, preserve the order of files */
      const responses = arr.map((_, index) => {
        if (downloadErrors[index]) {
          return { data: null, error: downloadErrors[index] };
        }
        return uploads.shift()!;
      });

      /** Return single object or array based on input urls */
      const uploadFileResponse = Array.isArray(urls) ? responses : responses[0];
      yield* Effect.logDebug("Finished uploading").pipe(
        Effect.annotateLogs("uploadResult", uploadFileResponse),
        Effect.withLogSpan("utapi.uploadFilesFromUrl"),
      );

      return uploadFileResponse;
    }).pipe(Effect.withLogSpan("uploadFilesFromUrl"));

    return await this.executeAsync(program, opts?.signal);
  }

  /**
   * Request to delete files from UploadThing storage.
   * @param {string | string[]} fileKeys
   *
   * @example
   * await deleteFiles("2e0fdb64-9957-4262-8e45-f372ba903ac8_image.jpg");
   *
   * @example
   * await deleteFiles(["2e0fdb64-9957-4262-8e45-f372ba903ac8_image.jpg","1649353b-04ea-48a2-9db7-31de7f562c8d_image2.jpg"])
   *
   * @example
   * await deleteFiles("myCustomIdentifier", { keyType: "customId" })
   */
  deleteFiles = async (keys: string[] | string, opts?: DeleteFilesOptions) => {
    guardServerOnly();
    const { keyType = this.defaultKeyType } = opts ?? {};

    class DeleteFileResponse extends S.Class<DeleteFileResponse>(
      "DeleteFileResponse",
    )({
      success: S.Boolean,
      deletedCount: S.Number,
    }) {}

    return await this.executeAsync(
      this.requestUploadThing(
        "/v6/deleteFiles",
        keyType === "fileKey"
          ? { fileKeys: asArray(keys) }
          : { customIds: asArray(keys) },
        DeleteFileResponse,
      ).pipe(Effect.withLogSpan("deleteFiles")),
    );
  };

  /**
   * Request file URLs from UploadThing storage.
   * @param {string | string[]} fileKeys
   *
   * @example
   * const data = await getFileUrls("2e0fdb64-9957-4262-8e45-f372ba903ac8_image.jpg");
   * console.log(data); // [{key: "2e0fdb64-9957-4262-8e45-f372ba903ac8_image.jpg", url: "https://uploadthing.com/f/2e0fdb64-9957-4262-8e45-f372ba903ac8_image.jpg"}]
   *
   * @example
   * const data = await getFileUrls(["2e0fdb64-9957-4262-8e45-f372ba903ac8_image.jpg","1649353b-04ea-48a2-9db7-31de7f562c8d_image2.jpg"])
   * console.log(data) // [{key: "2e0fdb64-9957-4262-8e45-f372ba903ac8_image.jpg", url: "https://uploadthing.com/f/2e0fdb64-9957-4262-8e45-f372ba903ac8_image.jpg" },{key: "1649353b-04ea-48a2-9db7-31de7f562c8d_image2.jpg", url: "https://uploadthing.com/f/1649353b-04ea-48a2-9db7-31de7f562c8d_image2.jpg"}]
   *
   * @deprecated - See https://docs.uploadthing.com/working-with-files#accessing-files for info how to access files
   */
  getFileUrls = async (keys: string[] | string, opts?: GetFileUrlsOptions) => {
    guardServerOnly();

    const { keyType = this.defaultKeyType } = opts ?? {};

    class GetFileUrlResponse extends S.Class<GetFileUrlResponse>(
      "GetFileUrlResponse",
    )({
      data: S.Array(
        S.Struct({
          key: S.String,
          url: S.String,
        }),
      ),
    }) {}

    return await this.executeAsync(
      this.requestUploadThing(
        "/v6/getFileUrl",
        keyType === "fileKey"
          ? { fileKeys: asArray(keys) }
          : { customIds: asArray(keys) },
        GetFileUrlResponse,
      ).pipe(Effect.withLogSpan("getFileUrls")),
    );
  };

  /**
   * Request file list from UploadThing storage.
   * @param {object} opts
   * @param {number} opts.limit The maximum number of files to return
   * @param {number} opts.offset The number of files to skip
   *
   * @example
   * const data = await listFiles({ limit: 1 });
   * console.log(data); // { key: "2e0fdb64-9957-4262-8e45-f372ba903ac8_image.jpg", id: "2e0fdb64-9957-4262-8e45-f372ba903ac8" }
   */
  listFiles = async (opts?: ListFilesOptions) => {
    guardServerOnly();

    class ListFileResponse extends S.Class<ListFileResponse>(
      "ListFileResponse",
    )({
      hasMore: S.Boolean,
      files: S.Array(
        S.Struct({
          id: S.String,
          customId: S.NullOr(S.String),
          key: S.String,
          name: S.String,
          status: S.Literal(
            "Deletion Pending",
            "Failed",
            "Uploaded",
            "Uploading",
          ),
        }),
      ),
    }) {}

    return await this.executeAsync(
      this.requestUploadThing(
        "/v6/listFiles",
        { ...opts },
        ListFileResponse,
      ).pipe(Effect.withLogSpan("listFiles")),
    );
  };

  renameFiles = async (updates: RenameFileUpdate | RenameFileUpdate[]) => {
    guardServerOnly();

    class RenameFileResponse extends S.Class<RenameFileResponse>(
      "RenameFileResponse",
    )({
      success: S.Boolean,
    }) {}

    return await this.executeAsync(
      this.requestUploadThing(
        "/v6/renameFiles",
        { updates: asArray(updates) },
        RenameFileResponse,
      ).pipe(Effect.withLogSpan("renameFiles")),
    );
  };

  getUsageInfo = async () => {
    guardServerOnly();

    class GetUsageInfoResponse extends S.Class<GetUsageInfoResponse>(
      "GetUsageInfoResponse",
    )({
      totalBytes: S.Number,
      appTotalBytes: S.Number,
      filesUploaded: S.Number,
      limitBytes: S.Number,
    }) {}

    return await this.executeAsync(
      this.requestUploadThing(
        "/v6/getUsageInfo",
        {},
        GetUsageInfoResponse,
      ).pipe(Effect.withLogSpan("getUsageInfo")),
    );
  };

  /** Request a presigned url for a private file(s) */
  getSignedURL = async (key: string, opts?: GetSignedURLOptions) => {
    guardServerOnly();

    const expiresIn = opts?.expiresIn
      ? parseTimeToSeconds(opts.expiresIn)
      : undefined;
    const { keyType = this.defaultKeyType } = opts ?? {};

    if (opts?.expiresIn && isNaN(expiresIn!)) {
      throw new UploadThingError({
        code: "BAD_REQUEST",
        message:
          "expiresIn must be a valid time string, for example '1d', '2 days', or a number of seconds.",
      });
    }
    if (expiresIn && expiresIn > 86400 * 7) {
      throw new UploadThingError({
        code: "BAD_REQUEST",
        message: "expiresIn must be less than 7 days (604800 seconds).",
      });
    }

    class GetSignedUrlResponse extends S.Class<GetSignedUrlResponse>(
      "GetSignedUrlResponse",
    )({
      url: S.String,
    }) {}

    return await this.executeAsync(
      this.requestUploadThing(
        "/v6/requestFileAccess",
        keyType === "fileKey"
          ? { fileKey: key, expiresIn }
          : { customId: key, expiresIn },
        GetSignedUrlResponse,
      ).pipe(Effect.withLogSpan("getSignedURL")),
    );
  };

  /**
   * Update the ACL of a file or set of files.
   *
   * @example
   * // Make a single file public
   * await utapi.updateACL("2e0fdb64-9957-4262-8e45-f372ba903ac8_image.jpg", "public-read");
   *
   * // Make multiple files private
   * await utapi.updateACL(
   *   [
   *     "2e0fdb64-9957-4262-8e45-f372ba903ac8_image.jpg",
   *     "1649353b-04ea-48a2-9db7-31de7f562c8d_image2.jpg",
   *   ],
   *   "private",
   * );
   */
  updateACL = async (
    keys: string | string[],
    acl: ACL,
    opts?: ACLUpdateOptions,
  ) => {
    guardServerOnly();

    const { keyType = this.defaultKeyType } = opts ?? {};
    const updates = asArray(keys).map((key) => {
      return keyType === "fileKey"
        ? { fileKey: key, acl }
        : { customId: key, acl };
    });

    const responseSchema = S.Struct({
      success: S.Boolean,
    });

    return await this.executeAsync(
      this.requestUploadThing(
        "/v6/updateACL",
        { updates },
        responseSchema,
      ).pipe(Effect.withLogSpan("updateACL")),
    );
  };
}
