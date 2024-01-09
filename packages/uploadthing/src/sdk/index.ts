import type {
  ACL,
  ContentDisposition,
  FetchEsque,
  Json,
  MaybeUrl,
} from "@uploadthing/shared";
import { generateUploadThingURL, UploadThingError } from "@uploadthing/shared";

import { UPLOADTHING_VERSION } from "../constants";
import { incompatibleNodeGuard } from "../internal/incompat-node-guard";
import type { FileEsque, UploadFileResponse } from "./utils";
import {
  getApiKeyOrThrow,
  guardServerOnly,
  uploadFilesInternal,
} from "./utils";

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
    };

    // Assert some stuff
    guardServerOnly();
    getApiKeyOrThrow(this.apiKey);
    incompatibleNodeGuard();
  }

  private async requestUploadThing<T extends Record<string, unknown>>(
    pathname: `/${string}`,
    body: Record<string, unknown>,
    fallbackErrorMessage: string,
  ) {
    const res = await this.fetch(generateUploadThingURL(pathname), {
      method: "POST",
      cache: "no-store",
      headers: this.defaultHeaders,
      body: JSON.stringify(body),
    });

    const json = await res.json<T | { error: string }>();
    if (!res.ok || "error" in json) {
      console.error("[UT] Error:", json);
      throw new UploadThingError({
        code: "INTERNAL_SERVER_ERROR",
        message:
          "error" in json && typeof json.error === "string"
            ? json.error
            : fallbackErrorMessage,
      });
    }

    return json;
  }

  /**
   * @param {FileEsque | FileEsque[]} files The file(s) to upload
   * @param {Json} metadata JSON-parseable metadata to attach to the uploaded file(s)
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
  async uploadFiles<T extends FileEsque | FileEsque[]>(
    files: T,
    opts?: {
      metadata?: Json;
      contentDisposition?: ContentDisposition;
      acl?: ACL;
    },
  ) {
    guardServerOnly();

    const filesToUpload: FileEsque[] = Array.isArray(files) ? files : [files];

    const uploads = await uploadFilesInternal(
      {
        files: filesToUpload,
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

    return uploadFileResponse as T extends FileEsque[]
      ? UploadFileResponse[]
      : UploadFileResponse;
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
  async uploadFilesFromUrl<T extends MaybeUrl | MaybeUrl[]>(
    urls: T,
    opts?: {
      metadata: Json;
      contentDisposition: ContentDisposition;
      acl?: ACL;
    },
  ) {
    guardServerOnly();

    const fileUrls: MaybeUrl[] = Array.isArray(urls) ? urls : [urls];

    const formData = new FormData();
    formData.append("metadata", JSON.stringify(opts?.metadata ?? {}));

    const filesToUpload = await Promise.all(
      fileUrls.map(async (url) => {
        if (typeof url === "string") url = new URL(url);
        const filename = url.pathname.split("/").pop() ?? "unknown-filename";

        // Download the file on the user's server to avoid egress charges
        const fileResponse = await fetch(url);
        if (!fileResponse.ok) {
          throw new UploadThingError({
            code: "BAD_REQUEST",
            message: "Failed to download requested file.",
            cause: fileResponse,
          });
        }
        const blob = await fileResponse.blob();
        return Object.assign(blob, { name: filename });
      }),
    );

    const uploads = await uploadFilesInternal(
      {
        files: filesToUpload,
        metadata: opts?.metadata ?? {},
        contentDisposition: opts?.contentDisposition ?? "inline",
        acl: opts?.acl,
      },
      {
        fetch: this.fetch,
        utRequestHeaders: this.defaultHeaders,
      },
    );

    const uploadFileResponse = Array.isArray(urls) ? uploads : uploads[0];

    return uploadFileResponse as T extends MaybeUrl[]
      ? UploadFileResponse[]
      : UploadFileResponse;
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
   */
  async deleteFiles(fileKeys: string[] | string) {
    guardServerOnly();

    if (!Array.isArray(fileKeys)) fileKeys = [fileKeys];

    return this.requestUploadThing<{ success: boolean }>(
      "/api/deleteFile",
      { fileKeys },
      "An unknown error occured while deleting files.",
    );
  }

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
  async getFileUrls(fileKeys: string[] | string) {
    guardServerOnly();

    if (!Array.isArray(fileKeys)) fileKeys = [fileKeys];

    const json = await this.requestUploadThing<{
      data: { key: string; url: string }[];
    }>(
      "/api/getFileUrl",
      { fileKeys },
      "An unknown error occured while retrieving file URLs.",
    );

    return json.data;
  }

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
  async listFiles(opts: { limit?: number; offset?: number }) {
    guardServerOnly();

    const json = await this.requestUploadThing<{
      files: {
        key: string;
        id: string;
        status: "Deletion Pending" | "Failed" | "Uploaded" | "Uploading";
      }[];
    }>("/api/listFiles", opts, "An unknown error occured while listing files.");

    return json.files;
  }

  async renameFile(
    updates:
      | {
          fileKey: string;
          newName: string;
        }
      | {
          fileKey: string;
          newName: string;
        }[],
  ) {
    guardServerOnly();

    if (!Array.isArray(updates)) updates = [updates];

    return this.requestUploadThing<{ success: true }>(
      "/api/renameFile",
      { updates },
      "An unknown error occured while renaming files.",
    );
  }

  async getUsageInfo() {
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
      "An unknown error occured while getting usage info.",
    );
  }

  /** Request a presigned url for a private file(s) */
  async getSignedURL(
    fileKey: string,
    opts?: {
      /**
       * How long the URL will be valid for.
       * - Must be positive and less than 7 days (604800 seconds).
       * - You must accept overrides on the UploadThing dashboard for this option to be accepted.
       * @default app default on UploadThing dashboard
       */
      expiresInSeconds?: number;
    },
  ) {
    const json = await this.requestUploadThing<{ url: string }>(
      "/api/requestFileAccess",
      { fileKey, expiresIn: opts?.expiresInSeconds },
      "An unknown error occured while retrieving presigned URLs.",
    );

    return json.url;
  }
}
