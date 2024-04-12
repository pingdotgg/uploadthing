import * as S from "@effect/schema/Schema";
import { Effect, Layer } from "effect";

import type {
  ACL,
  FetchContextTag,
  FetchEsque,
  MaybeUrl,
  SerializedUploadThingError,
} from "@uploadthing/shared";
import {
  asArray,
  fetchContext,
  fetchEffJson,
  filterObjectValues,
  generateUploadThingURL,
  UploadThingError,
} from "@uploadthing/shared";

import { UPLOADTHING_VERSION } from "../internal/constants";
import { getApiKeyOrThrow } from "../internal/get-api-key";
import { incompatibleNodeGuard } from "../internal/incompat-node-guard";
import { initLogger, logger } from "../internal/logger";
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
import {
  downloadFiles,
  guardServerOnly,
  parseTimeToSeconds,
  uploadFilesInternal,
} from "./utils";

export { UTFile };

export class UTApi {
  private fetch: FetchEsque;
  private defaultHeaders: FetchContextTag["baseHeaders"];
  private defaultKeyType: "fileKey" | "customId";

  constructor(opts?: UTApiOptions) {
    const apiKey = getApiKeyOrThrow(opts?.apiKey);

    // Assert some stuff
    guardServerOnly();
    incompatibleNodeGuard();

    this.fetch = opts?.fetch ?? globalThis.fetch;
    this.defaultHeaders = {
      "x-uploadthing-api-key": apiKey,
      "x-uploadthing-version": UPLOADTHING_VERSION,
      "x-uploadthing-be-adapter": "server-sdk",
      "x-uploadthing-fe-package": undefined,
    };
    this.defaultKeyType = opts?.defaultKeyType ?? "fileKey";

    initLogger(opts?.logLevel);
  }

  private requestUploadThing = <T>(
    pathname: `/${string}`,
    body: Record<string, unknown>,
    responseSchema: S.Schema<T, any>,
  ) => {
    const url = generateUploadThingURL(pathname);
    logger.debug("Requesting UploadThing:", {
      url,
      body,
      headers: this.defaultHeaders,
    });

    return fetchEffJson(url, responseSchema, {
      method: "POST",
      cache: "no-store",
      body: JSON.stringify(body),
      headers: {
        ...filterObjectValues(
          this.defaultHeaders,
          (v): v is string => typeof v === "string",
        ),
        "Content-Type": "application/json",
      },
    }).pipe(
      Effect.catchTag("FetchError", (err) => {
        logger.error("Request failed:", err);
        return Effect.die(err);
      }),
      Effect.catchTag("ParseError", (err) => {
        logger.error("Response parsing failed:", err);
        return Effect.die(err);
      }),
      Effect.tap((res) => logger.debug("UploadThing response:", res)),
    );
  };

  private executeAsync = <A, E>(
    program: Effect.Effect<A, E, FetchContextTag>,
  ) =>
    program.pipe(
      Effect.provide(
        Layer.succeed(fetchContext, {
          fetch: this.fetch,
          baseHeaders: this.defaultHeaders,
        }),
      ),
      Effect.runPromise,
    );

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
      uploadFilesInternal({
        files: asArray(files),
        contentDisposition: opts?.contentDisposition ?? "inline",
        metadata: opts?.metadata ?? {},
        acl: opts?.acl,
      }),
    );

    const uploadFileResponse = Array.isArray(files) ? uploads : uploads[0];
    logger.debug("Finished uploading:", uploadFileResponse);
    return uploadFileResponse;
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

    const uploads = await this.executeAsync(
      downloadFiles(asArray(urls), downloadErrors).pipe(
        Effect.andThen((files) => files.filter((f): f is UTFile => f != null)),
        Effect.andThen((files) =>
          uploadFilesInternal({
            files,
            contentDisposition: opts?.contentDisposition ?? "inline",
            metadata: opts?.metadata ?? {},
            acl: opts?.acl,
          }),
        ),
      ),
    );

    /** Put it all back together, preserve the order of files */
    const responses = asArray(urls).map((_, index) => {
      if (downloadErrors[index]) {
        return { data: null, error: downloadErrors[index] };
      }
      return uploads.shift()!;
    });

    /** Return single object or array based on input urls */
    const uploadFileResponse = Array.isArray(urls) ? responses : responses[0];

    logger.debug("Finished uploading:", uploadFileResponse);
    return uploadFileResponse;
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

    const responseSchema = S.struct({
      success: S.boolean,
    });

    return await this.executeAsync(
      this.requestUploadThing(
        "/api/deleteFiles",
        keyType === "fileKey"
          ? { fileKeys: asArray(keys) }
          : { customIds: asArray(keys) },
        responseSchema,
      ),
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
   */
  getFileUrls = async (keys: string[] | string, opts?: GetFileUrlsOptions) => {
    guardServerOnly();

    const { keyType = this.defaultKeyType } = opts ?? {};

    const responseSchema = S.struct({
      data: S.array(
        S.struct({
          key: S.string,
          url: S.string,
        }),
      ),
    });

    return await this.executeAsync(
      this.requestUploadThing(
        "/api/getFileUrl",
        keyType === "fileKey" ? { fileKeys: keys } : { customIds: keys },
        responseSchema,
      ),
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

    const responseSchema = S.struct({
      files: S.array(
        S.struct({
          id: S.string,
          key: S.string,
          name: S.string,
          status: S.literal(
            "Deletion Pending",
            "Failed",
            "Uploaded",
            "Uploading",
          ),
        }),
      ),
    });

    return await this.executeAsync(
      this.requestUploadThing("/api/listFiles", { ...opts }, responseSchema),
    );
  };

  renameFiles = async (updates: RenameFileUpdate | RenameFileUpdate[]) => {
    guardServerOnly();

    const responseSchema = S.struct({
      success: S.boolean,
    });

    return await this.executeAsync(
      this.requestUploadThing(
        "/api/renameFiles",
        { updates: asArray(updates) },
        responseSchema,
      ),
    );
  };

  /** @deprecated Use {@link renameFiles} instead. */
  public renameFile = this.renameFiles;

  getUsageInfo = async () => {
    guardServerOnly();

    const responseSchema = S.struct({
      totalBytes: S.number,
      totalReadable: S.string,
      appTotalBytes: S.number,
      appTotalReadable: S.string,
      filesUploaded: S.number,
      limitBytes: S.number,
      limitReadable: S.string,
    });

    return await this.executeAsync(
      this.requestUploadThing("/api/getUsageInfo", {}, responseSchema),
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

    const responseSchema = S.struct({
      url: S.string,
    });

    return await this.executeAsync(
      this.requestUploadThing(
        "/api/requestFileAccess",
        keyType === "fileKey"
          ? { fileKey: key, expiresIn }
          : { customId: key, expiresIn },
        responseSchema,
      ),
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

    const responseSchema = S.struct({
      success: S.boolean,
    });

    return await this.executeAsync(
      this.requestUploadThing("/api/updateACL", { updates }, responseSchema),
    );
  };
}
