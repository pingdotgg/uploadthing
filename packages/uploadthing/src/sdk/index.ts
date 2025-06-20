import type { FetchHttpClient, HttpClientError } from "@effect/platform";
import {
  HttpClient,
  HttpClientRequest,
  HttpClientResponse,
} from "@effect/platform";
import * as Arr from "effect/Array";
import * as Cause from "effect/Cause";
import * as Effect from "effect/Effect";
import type { ManagedRuntime } from "effect/ManagedRuntime";
import type { ParseError } from "effect/ParseResult";
import * as Redacted from "effect/Redacted";
import * as S from "effect/Schema";

import type { ACL, FetchEsque, MaybeUrl } from "@uploadthing/shared";
import {
  generateSignedURL,
  parseTimeToSeconds,
  UploadThingError,
} from "@uploadthing/shared";

import {
  ApiUrl,
  DoAppIDInUrls,
  UfsHost,
  UPLOADTHING_VERSION,
  UTToken,
} from "../_internal/config";
import { logHttpClientError, logHttpClientResponse } from "../_internal/logger";
import { makeRuntime } from "../_internal/runtime";
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
import { downloadFile, guardServerOnly, uploadFile } from "./utils";

export { UTFile };

export class UTApi {
  private fetch: FetchEsque;
  private defaultKeyType: "fileKey" | "customId";
  private runtime: ManagedRuntime<
    HttpClient.HttpClient | FetchHttpClient.Fetch,
    UploadThingError
  >;
  private opts: UTApiOptions;
  constructor(options?: UTApiOptions) {
    // Assert some stuff
    guardServerOnly();
    this.opts = options ?? {};
    this.fetch = this.opts.fetch ?? globalThis.fetch;
    this.defaultKeyType = this.opts.defaultKeyType ?? "fileKey";
    this.runtime = makeRuntime(this.fetch, this.opts);
  }

  private requestUploadThing = <T>(
    pathname: `/${string}`,
    body: Record<string, unknown>,
    responseSchema: S.Schema<T, any>,
  ) =>
    Effect.gen(this, function* () {
      const { apiKey } = yield* UTToken;
      const baseUrl = yield* ApiUrl;
      const httpClient = (yield* HttpClient.HttpClient).pipe(
        HttpClient.filterStatusOk,
      );

      return yield* HttpClientRequest.post(pathname).pipe(
        HttpClientRequest.prependUrl(baseUrl),
        HttpClientRequest.bodyUnsafeJson(body),
        HttpClientRequest.setHeaders({
          "x-uploadthing-version": UPLOADTHING_VERSION,
          "x-uploadthing-be-adapter": "server-sdk",
          "x-uploadthing-api-key": Redacted.value(apiKey),
        }),
        httpClient.execute,
        Effect.tapBoth({
          onSuccess: logHttpClientResponse("UploadThing API Response"),
          onFailure: logHttpClientError("Failed to request UploadThing API"),
        }),
        Effect.flatMap(HttpClientResponse.schemaBodyJson(responseSchema)),
        Effect.scoped,
      );
    }).pipe(
      Effect.catchTag(
        "ConfigError",
        (e) =>
          new UploadThingError({
            code: "INVALID_SERVER_CONFIG",
            message:
              "There was an error with the server configuration. More info can be found on this error's `cause` property",
            cause: e,
          }),
      ),
      Effect.withLogSpan("utapi.#requestUploadThing"),
    );

  private executeAsync = async <A>(
    program: Effect.Effect<
      A,
      UploadThingError | ParseError | HttpClientError.HttpClientError,
      HttpClient.HttpClient
    >,
    signal?: AbortSignal,
  ) => {
    const exit = await program.pipe(
      Effect.withLogSpan("utapi.#executeAsync"),
      (e) => this.runtime.runPromiseExit(e, signal ? { signal } : undefined),
    );

    if (exit._tag === "Failure") {
      throw Cause.squash(exit.cause);
    }

    return exit.value;
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
  uploadFiles(
    files: FileEsque | FileEsque[],
    opts?: UploadFilesOptions,
  ): Promise<UploadFileResult | UploadFileResult[]> {
    guardServerOnly();

    const concurrency = opts?.concurrency ?? 1;
    if (concurrency < 1 || concurrency > 25) {
      throw new UploadThingError({
        code: "BAD_REQUEST",
        message: "concurrency must be a positive integer between 1 and 25",
      });
    }

    const program: Effect.Effect<
      UploadFileResult | UploadFileResult[],
      never,
      HttpClient.HttpClient
    > = Effect.forEach(
      Arr.ensure(files),
      (file) =>
        uploadFile(file, opts ?? {}).pipe(
          Effect.match({
            onSuccess: (data) => ({ data, error: null }),
            onFailure: (error) => ({ data: null, error }),
          }),
        ),
      { concurrency },
    ).pipe(
      Effect.map((ups) => (Array.isArray(files) ? ups : ups[0]!)),
      Effect.tap((res) =>
        Effect.logDebug("Finished uploading").pipe(
          Effect.annotateLogs("uploadResult", res),
        ),
      ),
      Effect.withLogSpan("uploadFiles"),
    );

    return this.executeAsync(program, opts?.signal);
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
  uploadFilesFromUrl(
    urls: MaybeUrl | UrlWithOverrides | (MaybeUrl | UrlWithOverrides)[],
    opts?: UploadFilesOptions,
  ): Promise<UploadFileResult | UploadFileResult[]> {
    guardServerOnly();

    const concurrency = opts?.concurrency ?? 1;
    if (concurrency < 1 || concurrency > 25) {
      throw new UploadThingError({
        code: "BAD_REQUEST",
        message: "concurrency must be a positive integer between 1 and 25",
      });
    }

    const program: Effect.Effect<
      UploadFileResult | UploadFileResult[],
      never,
      HttpClient.HttpClient
    > = Effect.forEach(
      Arr.ensure(urls),
      (url) =>
        downloadFile(url).pipe(
          Effect.flatMap((file) => uploadFile(file, opts ?? {})),
          Effect.match({
            onSuccess: (data) => ({ data, error: null }),
            onFailure: (error) => ({ data: null, error }),
          }),
        ),
      { concurrency },
    )
      .pipe(
        Effect.map((ups) => (Array.isArray(urls) ? ups : ups[0]!)),
        Effect.tap((res) =>
          Effect.logDebug("Finished uploading").pipe(
            Effect.annotateLogs("uploadResult", res),
          ),
        ),
        Effect.withLogSpan("uploadFiles"),
      )
      .pipe(Effect.withLogSpan("uploadFilesFromUrl"));

    return this.executeAsync(program, opts?.signal);
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
          ? { fileKeys: Arr.ensure(keys) }
          : { customIds: Arr.ensure(keys) },
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
          ? { fileKeys: Arr.ensure(keys) }
          : { customIds: Arr.ensure(keys) },
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
          size: S.Number,
          status: S.Literal(
            "Deletion Pending",
            "Failed",
            "Uploaded",
            "Uploading",
          ),
          uploadedAt: S.Number,
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
        { updates: Arr.ensure(updates) },
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

  /**
   * Generate a presigned url for a private file
   * Unlike {@link getSignedURL}, this method does not make a fetch request to the UploadThing API
   * and is the recommended way to generate a presigned url for a private file.
   **/
  generateSignedURL = async (key: string, opts?: GetSignedURLOptions) => {
    guardServerOnly();

    const expiresIn = parseTimeToSeconds(opts?.expiresIn ?? "5 minutes");

    if (opts?.expiresIn && isNaN(expiresIn)) {
      throw new UploadThingError({
        code: "BAD_REQUEST",
        message:
          "expiresIn must be a valid time string, for example '1d', '2 days', or a number of seconds.",
      });
    }
    if (expiresIn > 86400 * 7) {
      throw new UploadThingError({
        code: "BAD_REQUEST",
        message: "expiresIn must be less than 7 days (604800 seconds).",
      });
    }

    const program = Effect.gen(function* () {
      const { apiKey, appId } = yield* UTToken;
      const ufsHost = yield* UfsHost;
      const doAppID = Boolean(yield* DoAppIDInUrls);
      const proto = ufsHost.includes("local") ? "http" : "https";
      const urlBase = doAppID
        ? `${proto}://${appId}.${ufsHost}/f/${key}`
        : `${proto}://${ufsHost}/f/${key}`;
      const ufsUrl = yield* generateSignedURL(urlBase, apiKey, {
        ttlInSeconds: expiresIn,
      });

      return {
        ufsUrl,
      };
    });

    return await this.executeAsync(
      program.pipe(
        Effect.catchTag(
          "ConfigError",
          (e) =>
            new UploadThingError({
              code: "INVALID_SERVER_CONFIG",
              message:
                "There was an error with the server configuration. More info can be found on this error's `cause` property",
              cause: e,
            }),
        ),
        Effect.withLogSpan("generateSignedURL"),
      ),
    );
  };

  /**
   * Request a presigned url for a private file(s)
   * @remarks This method is no longer recommended as it makes a fetch
   * request to the UploadThing API which incurs redundant latency. It
   * will be deprecated in UploadThing v8 and removed in UploadThing v9.
   *
   * @see {@link generateSignedURL} for a more efficient way to generate a presigned url
   **/
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
      ufsUrl: S.String,
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
    const updates = Arr.ensure(keys).map((key) => {
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
