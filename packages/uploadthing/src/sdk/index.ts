import type { Json } from "@uploadthing/shared";
import { generateUploadThingURL, UploadThingError } from "@uploadthing/shared";

import { UPLOADTHING_VERSION } from "../constants";
import { incompatibleNodeGuard } from "../internal/incompat-node-guard";
import type { FetchEsque, MaybeUrl } from "./types";
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
  private apiKey: string;
  private defaultHeaders: Record<string, string>;

  constructor(opts?: UTApiOptions) {
    this.fetch = opts?.fetch ?? globalThis.fetch;
    this.apiKey = getApiKeyOrThrow(opts?.apiKey);
    this.defaultHeaders = {
      "Content-Type": "application/json",
      "x-uploadthing-api-key": this.apiKey,
      "x-uploadthing-version": UPLOADTHING_VERSION,
    };
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
    metadata: Json = {},
  ) {
    guardServerOnly();
    incompatibleNodeGuard();

    const filesToUpload: FileEsque[] = Array.isArray(files) ? files : [files];

    const uploads = await uploadFilesInternal(
      {
        files: filesToUpload,
        metadata,
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
    metadata: Json = {},
  ) {
    guardServerOnly();

    const fileUrls: MaybeUrl[] = Array.isArray(urls) ? urls : [urls];

    const formData = new FormData();
    formData.append("metadata", JSON.stringify(metadata));

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
        metadata,
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

    const res = await this.fetch(generateUploadThingURL("/api/deleteFile"), {
      method: "POST",
      cache: "no-store",
      headers: this.defaultHeaders,
      body: JSON.stringify({ fileKeys }),
    });

    const json = await res.json<{ success: boolean } | { error: string }>();
    if (!res.ok || "error" in json) {
      console.error("[UT] Error: deleteFiles", json);
      throw new UploadThingError({
        code: "INTERNAL_SERVER_ERROR",
        message:
          "error" in json
            ? json.error
            : "An unknown error occured while deleting files.",
      });
    }

    return json;
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
    incompatibleNodeGuard();

    if (!Array.isArray(fileKeys)) fileKeys = [fileKeys];

    const res = await this.fetch(generateUploadThingURL("/api/getFileUrl"), {
      method: "POST",
      cache: "no-store",
      headers: this.defaultHeaders,
      body: JSON.stringify({ fileKeys }),
    });

    const json = await res.json<
      { data: { key: string; url: string }[] } | { error: string }
    >();

    if (!res.ok || "error" in json) {
      console.error("[UT] Error: getFileUrls", json);
      throw new UploadThingError({
        code: "INTERNAL_SERVER_ERROR",
        message:
          "error" in json
            ? json.error
            : "An unknown error occured while retrieving file URLs.",
      });
    }

    return json.data;
  }

  /**
   * Request file list from UploadThing storage.
   *
   * @example
   * const data = await listFiles();
   * console.log(data); // { key: "2e0fdb64-9957-4262-8e45-f372ba903ac8_image.jpg", id: "2e0fdb64-9957-4262-8e45-f372ba903ac8" }
   */
  async listFiles() {
    guardServerOnly();
    incompatibleNodeGuard();

    // TODO: Implement filtering and pagination
    const res = await this.fetch(generateUploadThingURL("/api/listFiles"), {
      method: "POST",
      cache: "no-store",
      headers: this.defaultHeaders,
    });

    const json = await res.json<
      { files: { key: string; id: string }[] } | { error: string }
    >();

    if (!res.ok || "error" in json) {
      console.log("[UT] Error: listFiles", json);
      throw new UploadThingError({
        code: "INTERNAL_SERVER_ERROR",
        message:
          "error" in json
            ? json.error
            : "An unknown error occured while listing files.",
      });
    }

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
    incompatibleNodeGuard();

    if (!Array.isArray(updates)) updates = [updates];

    const res = await this.fetch(generateUploadThingURL("/api/renameFile"), {
      method: "POST",
      cache: "no-store",
      headers: this.defaultHeaders,
      body: JSON.stringify({ updates }),
    });

    const json = await res.json<{ success: true } | { error: string }>();

    if (!res.ok || "error" in json) {
      console.error("[UT] Error: renameFile", json);
      throw new UploadThingError({
        code: "INTERNAL_SERVER_ERROR",
        message:
          "error" in json
            ? json.error
            : "An unknown error occured while renaming files.",
      });
    }

    return json;
  }

  async getUsageInfo() {
    guardServerOnly();
    incompatibleNodeGuard();

    const res = await this.fetch(generateUploadThingURL("/api/getUsageInfo"), {
      method: "POST",
      cache: "no-store",
      headers: this.defaultHeaders,
    });

    const json = await res.json<
      | { error: string }
      | {
          totalBytes: number;
          totalReadable: string;
          appTotalBytes: number;
          appTotalReadable: string;
          filesUploaded: number;
          limitBytes: number;
          limitReadable: string;
        }
    >();

    if (!res.ok || "error" in json) {
      console.error("[UT] Error: getUsageInfo", json);
      throw new UploadThingError({
        code: "INTERNAL_SERVER_ERROR",
        message:
          "error" in json
            ? json.error
            : "An unknown error occured while retrieving usage info.",
      });
    }

    return json;
  }
}

export const utapi = new UTApi();
