import { process } from "std-env";

import { lookup } from "@uploadthing/mime-types";
import type {
  FetchEsque,
  MaybeUrl,
  SerializedUploadThingError,
} from "@uploadthing/shared";
import {
  asArray,
  generateUploadThingURL,
  isObject,
  UploadThingError,
} from "@uploadthing/shared";

import { UPLOADTHING_VERSION } from "../internal/constants";
import { incompatibleNodeGuard } from "../internal/incompat-node-guard";
import { initLogger, logger } from "../internal/logger";
import type {
  ACLUpdate,
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
import {
  getApiKeyOrThrow,
  guardServerOnly,
  parseTimeToSeconds,
  uploadFilesInternal,
} from "./utils";

interface UTFilePropertyBag extends BlobPropertyBag {
  lastModified?: number;
  customId?: string;
}

/**
 * Extension of the Blob class that simplifies setting the `name` and `customId` properties,
 * similar to the built-in File class from Node > 20.
 */
export class UTFile extends Blob {
  name: string;
  lastModified: number;
  customId?: string;

  constructor(parts: BlobPart[], name: string, options?: UTFilePropertyBag) {
    const optionsWithDefaults = {
      ...options,
      type: options?.type ?? (lookup(name) || undefined),
      lastModified: options?.lastModified ?? Date.now(),
    };
    super(parts, optionsWithDefaults);
    this.name = name;
    this.customId = optionsWithDefaults.customId;
    this.lastModified = optionsWithDefaults.lastModified;
  }
}

export class UTApi {
  private fetch: FetchEsque;
  private apiKey: string | undefined;
  private defaultHeaders: Record<string, string>;
  private defaultKeyType: "fileKey" | "customId";

  constructor(opts?: UTApiOptions) {
    this.fetch = opts?.fetch ?? globalThis.fetch;
    this.apiKey = opts?.apiKey ?? process.env.UPLOADTHING_SECRET;
    this.defaultHeaders = {
      "Content-Type": "application/json",
      "x-uploadthing-api-key": this.apiKey!,
      "x-uploadthing-version": UPLOADTHING_VERSION,
      "x-uploadthing-be-adapter": "server-sdk",
    };
    this.defaultKeyType = opts?.defaultKeyType ?? "fileKey";

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

  private async requestUploadThing<T extends Record<string, unknown>>(
    pathname: `/${string}`,
    body: Record<string, unknown>,
    fallbackErrorMessage: string,
  ) {
    const url = generateUploadThingURL(pathname);
    logger.debug("Requesting UploadThing:", {
      url,
      body,
      headers: this.defaultHeaders,
    });
    const res = await this.fetch(url, {
      method: "POST",
      cache: "no-store",
      headers: this.defaultHeaders,
      body: JSON.stringify(body),
    });
    logger.debug("UploadThing responsed with status:", res.status);

    const json = await res.json<T | { error: string }>();
    if (!res.ok || "error" in json) {
      logger.error("Error:", json);
      throw new UploadThingError({
        code: "INTERNAL_SERVER_ERROR",
        message:
          "error" in json && typeof json.error === "string"
            ? json.error
            : fallbackErrorMessage,
      });
    }

    logger.debug("UploadThing response:", json);
    return json;
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

    const uploads = await uploadFilesInternal(
      {
        files: asArray(files),
        metadata: opts?.metadata ?? {},
        contentDisposition: opts?.contentDisposition ?? "inline",
        acl: opts?.acl,
      },
      {
        fetch: this.fetch,
        utRequestHeaders: this.defaultHeaders,
      },
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

    const formData = new FormData();
    formData.append("metadata", JSON.stringify(opts?.metadata ?? {}));

    const downloadErrors: Record<number, SerializedUploadThingError> = {};

    const files = await Promise.all(
      asArray(urls).map(async (_url, index) => {
        let url = isObject(_url) ? _url.url : _url;

        if (typeof url === "string") {
          // since dataurls will result in name being too long, tell the user
          // to use uploadFiles instead.
          if (url.startsWith("data:")) {
            downloadErrors[index] = UploadThingError.toObject(
              new UploadThingError({
                code: "BAD_REQUEST",
                message:
                  "Please use uploadFiles() for data URLs. uploadFilesFromUrl() is intended for use with remote URLs only.",
              }),
            );
            return undefined;
          }
          url = new URL(url);
        }

        const {
          name = url.pathname.split("/").pop() ?? "unknown-filename",
          customId = undefined,
        } = isObject(_url) ? _url : {};

        // Download the file on the user's server to avoid egress charges
        logger.debug("Downloading file:", url);
        const fileResponse = await this.fetch(url);
        if (!fileResponse.ok) {
          downloadErrors[index] = UploadThingError.toObject(
            new UploadThingError({
              code: "BAD_REQUEST",
              message: "Failed to download requested file.",
              cause: fileResponse,
            }),
          );
          return undefined;
        }
        logger.debug("Finished downloading file. Reading blob...");
        const blob = await fileResponse.blob();
        logger.debug("Finished reading blob.");
        return new UTFile([blob], name, { customId });
      }),
    ).then((files) => files.filter((x): x is UTFile => x !== undefined));

    logger.debug("Uploading files:", files);

    const uploads = await uploadFilesInternal(
      {
        files,
        metadata: opts?.metadata ?? {},
        contentDisposition: opts?.contentDisposition ?? "inline",
        acl: opts?.acl,
      },
      {
        fetch: this.fetch,
        utRequestHeaders: this.defaultHeaders,
      },
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

    return this.requestUploadThing<{ success: boolean }>(
      "/api/deleteFile",
      keyType === "fileKey"
        ? { fileKeys: asArray(keys) }
        : { customIds: asArray(keys) },
      "An unknown error occurred while deleting files.",
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

    const json = await this.requestUploadThing<{
      data: { key: string; url: string }[];
    }>(
      "/api/getFileUrl",
      keyType === "fileKey"
        ? { fileKeys: asArray(keys) }
        : { customIds: asArray(keys) },
      "An unknown error occurred while retrieving file URLs.",
    );

    return json.data;
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

    const json = await this.requestUploadThing<{
      files: {
        id: string;
        customId: string | null;
        key: string;
        name: string;
        status: "Deletion Pending" | "Failed" | "Uploaded" | "Uploading";
      }[];
    }>(
      "/api/listFiles",
      { ...opts },
      "An unknown error occurred while listing files.",
    );

    return json.files;
  };

  renameFiles = async (updates: RenameFileUpdate | RenameFileUpdate[]) => {
    guardServerOnly();

    return this.requestUploadThing<{ success: true }>(
      "/api/renameFiles",
      { updates: asArray(updates) },
      "An unknown error occurred while renaming files.",
    );
  };
  /** @deprecated Use {@link renameFiles} instead. */
  public renameFile = this.renameFiles;

  getUsageInfo = async () => {
    guardServerOnly();

    return this.requestUploadThing<{
      totalBytes: number;
      totalReadable: string;
      appTotalBytes: number;
      appTotalReadable: string;
      filesUploaded: number;
      limitBytes: number;
      limitReadable: string;
    }>(
      "/api/getUsageInfo",
      {},
      "An unknown error occurred while getting usage info.",
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

    const json = await this.requestUploadThing<{ url: string }>(
      "/api/requestFileAccess",
      keyType === "fileKey"
        ? { fileKey: key, expiresIn }
        : { customId: key, expiresIn },
      "An unknown error occurred while retrieving presigned URLs.",
    );

    return json.url;
  };

  /** Update the ACL of a file */
  updateACL = (updates: ACLUpdate | ACLUpdate[]) => {
    guardServerOnly();

    const updatesArray = asArray(updates).map((update) => {
      if ("key" in update) return { fileKey: update.key, acl: update.acl };
      return { customId: update.customId, acl: update.acl };
    });

    return this.requestUploadThing<{ success: true }>(
      "/api/updateACL",
      { updates: updatesArray },
      "An unknown error occurred while updating ACLs.",
    );
  };
}
