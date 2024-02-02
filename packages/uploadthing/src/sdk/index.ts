import { Schema } from "@effect/schema";
import { Effect, pipe } from "effect";
import { process } from "std-env";

import type {
  ACL,
  ContentDisposition,
  FetchEsque,
  Json,
  MaybeUrl,
} from "@uploadthing/shared";
import {
  asArray,
  fetchEffJson,
  generateUploadThingURL,
  UploadThingError,
} from "@uploadthing/shared";

import { UPLOADTHING_VERSION } from "../constants";
import { incompatibleNodeGuard } from "../internal/incompat-node-guard";
import type { LogLevel } from "../internal/logger";
import { initLogger, logger } from "../internal/logger";
import {
  downloadFiles,
  getApiKeyOrThrow,
  Goodies,
  guardServerOnly,
  parseTimeToSeconds,
  uploadFilesInternal,
} from "./utils";
import type { FileEsque, Time } from "./utils";

type Upload = Effect.Effect.Success<
  ReturnType<typeof uploadFilesInternal>
>[number];

export interface UTApiOptions {
  /**
   * Provide a custom fetch function.
   * @default globalThis.fetch
   */
  fetch?: FetchEsque;
  /**
   * Provide a custom UploadThing API key.
   * @default process.env.UPLOADTHING_SECRET
   */
  apiKey?: string;
  /**
   * @default "info"
   */
  logLevel?: LogLevel;
}

export class UTApi {
  private fetch: FetchEsque;
  private apiKey: string | undefined;
  private defaultHeaders: Record<string, string>;

  constructor(opts?: UTApiOptions) {
    this.fetch = opts?.fetch ?? globalThis.fetch;
    this.apiKey = opts?.apiKey ?? process.env.UPLOADTHING_SECRET;
    this.defaultHeaders = {
      "Content-Type": "application/json",
      "x-uploadthing-api-key": this.apiKey!,
      "x-uploadthing-version": UPLOADTHING_VERSION,
      "x-uploadthing-be-adapter": "server-sdk",
    };

    initLogger(opts?.logLevel);

    // Assert some stuff
    guardServerOnly();
    getApiKeyOrThrow(this.apiKey);
    if (!this.apiKey?.startsWith("sk_")) {
      throw new UploadThingError({
        code: "MISSING_ENV",
        message: "Invalid API key. API keys must start with `sk_`.",
      });
    }
    incompatibleNodeGuard();
  }

  private requestUploadThing<T>(
    pathname: `/${string}`,
    body: Record<string, unknown>,
    responseSchema: Schema.Schema<never, any, T>,
  ) {
    const url = generateUploadThingURL(pathname);
    logger.debug("Requesting UploadThing:", {
      url,
      body,
      headers: this.defaultHeaders,
    });

    return fetchEffJson(this.fetch, responseSchema, url, {
      method: "POST",
      cache: "no-store",
      body: JSON.stringify(body),
      headers: this.defaultHeaders,
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
  }

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
  uploadFiles = async <T extends FileEsque | FileEsque[]>(
    files: T,
    opts?: {
      metadata?: Json;
      contentDisposition?: ContentDisposition;
      acl?: ACL;
    },
  ) => {
    guardServerOnly();

    const uploads = await Effect.provideService(
      uploadFilesInternal({
        files: asArray(files),
        contentDisposition: opts?.contentDisposition ?? "inline",
        metadata: opts?.metadata ?? {},
        acl: opts?.acl,
      }),
      Goodies,
      Goodies.of({
        fetch: this.fetch,
        utRequestHeaders: this.defaultHeaders,
      }),
    ).pipe(Effect.runPromise);

    const uploadFileResponse = Array.isArray(files) ? uploads : uploads[0];
    logger.debug("Finished uploading:", uploadFileResponse);
    return uploadFileResponse as T extends FileEsque[] ? Upload[] : Upload;
  };

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
  uploadFilesFromUrl = async <T extends MaybeUrl | MaybeUrl[]>(
    urls: T,
    opts?: {
      metadata: Json;
      contentDisposition: ContentDisposition;
      acl?: ACL;
    },
  ) => {
    guardServerOnly();

    const uploads = await Effect.provideService(
      pipe(
        downloadFiles(asArray(urls)),
        Effect.andThen((files) =>
          uploadFilesInternal({
            files,
            contentDisposition: opts?.contentDisposition ?? "inline",
            metadata: opts?.metadata ?? {},
            acl: opts?.acl,
          }),
        ),
      ),
      Goodies,
      Goodies.of({
        fetch: this.fetch,
        utRequestHeaders: this.defaultHeaders,
      }),
    ).pipe(Effect.runPromise);

    const uploadFileResponse = Array.isArray(urls) ? uploads : uploads[0];
    logger.debug("Finished uploading:", uploadFileResponse);
    return uploadFileResponse as T extends MaybeUrl[] ? Upload[] : Upload;
  };

  /**
   * Request to delete files from UploadThing storage.
   * @param {string | string[]} fileKeys
   *
   * @example
   * await deleteFiles("2e0fdb64-9957-4262-8e45-f372ba903ac8_image.jpg");
   *
   * @example
   * await deleteFiles(["2e0fdb64-9957-4262-8e45-f372ba903ac8_image.jpg","1649353b-04ea-48a2-9db7-31de7f562c8d_image2.jpg"])
   */
  deleteFiles = (fileKeys: string[] | string) => {
    guardServerOnly();

    const responseSchema = Schema.struct({
      success: Schema.boolean,
    });

    return this.requestUploadThing(
      "/api/deleteFiles",
      { fileKeys: asArray(fileKeys) },
      responseSchema,
    ).pipe(Effect.runPromise);
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
  getFileUrls = (fileKeys: string[] | string) => {
    guardServerOnly();

    const responseSchema = Schema.struct({
      data: Schema.array(
        Schema.struct({
          key: Schema.string,
          url: Schema.string,
        }),
      ),
    });

    return this.requestUploadThing(
      "/api/getFileUrl",
      { fileKeys: asArray(fileKeys) },
      responseSchema,
    ).pipe(
      Effect.andThen((r) => r.data),
      Effect.runPromise,
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
  listFiles = (opts: { limit?: number; offset?: number }) => {
    guardServerOnly();

    const responseSchema = Schema.struct({
      files: Schema.array(
        Schema.struct({
          key: Schema.string,
          id: Schema.string,
          status: Schema.literal(
            "Deletion Pending",
            "Failed",
            "Uploaded",
            "Uploading",
          ),
        }),
      ),
    });

    return this.requestUploadThing("/api/listFiles", opts, responseSchema).pipe(
      Effect.andThen((r) => r.files),
      Effect.runPromise,
    );
  };

  renameFiles = (
    updates:
      | {
          fileKey: string;
          newName: string;
        }
      | {
          fileKey: string;
          newName: string;
        }[],
  ) => {
    guardServerOnly();

    const responseSchema = Schema.struct({
      success: Schema.boolean,
    });

    return this.requestUploadThing(
      "/api/renameFiles",
      { updates: asArray(updates) },
      responseSchema,
    ).pipe(Effect.runPromise);
  };
  /** @deprecated Use {@link renameFiles} instead. */
  renameFile = this.renameFiles;

  getUsageInfo = () => {
    guardServerOnly();

    const responseSchema = Schema.struct({
      totalBytes: Schema.number,
      totalReadable: Schema.string,
      appTotalBytes: Schema.number,
      appTotalReadable: Schema.string,
      filesUploaded: Schema.number,
      limitBytes: Schema.number,
      limitReadable: Schema.string,
    });

    return this.requestUploadThing(
      "/api/getUsageInfo",
      {},
      responseSchema,
    ).pipe(Effect.runPromise);
  };

  /** Request a presigned url for a private file(s) */
  getSignedURL = (
    fileKey: string,
    opts?: {
      /**
       * How long the URL will be valid for.
       * - Must be positive and less than 7 days (604800 seconds).
       * - You must accept overrides on the UploadThing dashboard for this option to be accepted.
       * @default app default on UploadThing dashboard
       */
      expiresIn?: Time;
    },
  ) => {
    guardServerOnly();

    const expiresIn = opts?.expiresIn
      ? parseTimeToSeconds(opts.expiresIn)
      : undefined;

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

    const responseSchema = Schema.struct({
      url: Schema.string,
    });

    return this.requestUploadThing(
      "/api/requestFileAccess",
      { fileKey, expiresIn },
      responseSchema,
    ).pipe(
      Effect.andThen((r) => r.url),
      Effect.runPromise,
    );
  };
}
