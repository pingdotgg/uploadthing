import { Array, Predicate } from "effect";
import type { ParseResult } from "effect";
import * as Effect from "effect/Effect";

import type { ACL, Either, FetchEsque, MaybeUrl } from "@uploadthing/shared";
import { UploadThingError } from "@uploadthing/shared";

import { makeRuntime } from "../_internal/runtime";
import { DeleteFilesCommand } from "./commands/delete-files";
import type { DeleteFilesOptions } from "./commands/delete-files";
import type { GetFileUrlsOptions } from "./commands/get-file-urls";
import { GetFileUrlsCommand } from "./commands/get-file-urls";
import type { GetSignedURLOptions } from "./commands/get-signed-url";
import { GetSignedURLCommand } from "./commands/get-signed-url";
import { GetUsageInfoCommand } from "./commands/get-usage-info";
import type { ListFilesOptions } from "./commands/list-files";
import { ListFilesCommand } from "./commands/list-files";
import type { RenameFileUpdate } from "./commands/rename-files";
import { RenameFilesCommand } from "./commands/rename-files";
import type { UpdateACLOptions } from "./commands/update-acl";
import { UpdateACLCommand } from "./commands/update-acl";
import { UploadFileCommand } from "./commands/upload-file";
import type {
  BaseUploadOptions,
  FileEsque,
  UploadFileResult,
} from "./commands/upload-file";
import type { Command, UrlWithOverrides, UTApiOptions } from "./types";
import { UTFile } from "./ut-file";

export { UTFile };

export * from "./commands/delete-files";
export * from "./commands/get-file-urls";
export * from "./commands/get-signed-url";
export * from "./commands/get-usage-info";
export * from "./commands/list-files";
export * from "./commands/rename-files";
export * from "./commands/update-acl";
export * from "./commands/upload-file";

/**
 * Create the client that will be used to execute individual commands.
 * This is good if you want a minimal footprint as it treeshakes well.
 */
export function createClient(opts?: UTApiOptions) {
  const runtime = makeRuntime(opts?.fetch ?? globalThis.fetch, opts);

  return {
    execute: async <TOutput>(
      /**
       * The command to execute
       */
      command: ReturnType<Command<unknown, TOutput>>,
      /**
       * AbortSignal that can be used to cancel the command
       */
      signal?: AbortSignal,
    ): Promise<Either<TOutput, UploadThingError | ParseResult.ParseError>> => {
      return Effect.match(command, {
        onSuccess: (value) => ({ data: value, error: null }),
        onFailure: (error) => ({ data: null, error: error }),
      }).pipe((effect) => runtime.runPromise(effect, { signal }));
    },
  };
}

function guardServerOnly() {
  if (typeof window !== "undefined") {
    throw new UploadThingError({
      code: "INTERNAL_SERVER_ERROR",
      message: "The `utapi` can only be used on the server.",
    });
  }
}

/**
 * A client that has all the commands available.
 * Using this instead of {@link createClient} will incur a larger bundle size
 * as it includes all the commands and does not treeshake well.
 */
export class UTApi {
  private client: ReturnType<typeof createClient>;
  private fetch: FetchEsque;

  constructor(opts?: UTApiOptions) {
    this.client = createClient(opts);
    this.fetch = opts?.fetch ?? globalThis.fetch;
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
  async uploadFiles(
    files: FileEsque,
    opts?: BaseUploadOptions,
  ): Promise<UploadFileResult>;
  async uploadFiles(
    files: FileEsque[],
    opts?: BaseUploadOptions,
  ): Promise<UploadFileResult[]>;
  async uploadFiles(
    files: FileEsque | FileEsque[],
    opts?: BaseUploadOptions,
  ): Promise<UploadFileResult | UploadFileResult[]> {
    guardServerOnly();

    const commands = [];

    for (const file of Array.ensure(files)) {
      commands.push(UploadFileCommand({ ...opts, body: file }));
    }

    // TODO: move concurrency to the client: client.execute(...commands) ?
    const results = await Promise.all(
      commands.map((command) => this.client.execute(command)),
    );

    return results as any;
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
    opts?: BaseUploadOptions,
  ): Promise<UploadFileResult>;
  uploadFilesFromUrl(
    urls: (MaybeUrl | UrlWithOverrides)[],
    opts?: BaseUploadOptions,
  ): Promise<UploadFileResult[]>;
  async uploadFilesFromUrl(
    urls: MaybeUrl | UrlWithOverrides | (MaybeUrl | UrlWithOverrides)[],
    opts?: BaseUploadOptions,
  ): Promise<UploadFileResult | UploadFileResult[]> {
    guardServerOnly();

    const makeCommand = async (url: MaybeUrl | UrlWithOverrides) => {
      const string = Predicate.isRecord(url) ? url.url : url;
      let name = Predicate.isRecord(url) ? url.name : undefined;
      if (!name) name = string.toString().split("/").at(-1);

      return UploadFileCommand({
        ...opts,
        name: name,
        customId: Predicate.isRecord(url) ? url.customId : undefined,
        body: await this.fetch(string),
      });
    };

    const commands = [];
    for (const url of Array.ensure(urls)) {
      commands.push(await makeCommand(url));
    }

    // TODO: move concurrency to the client: client.execute(...commands) ?
    const results = await Promise.all(
      commands.map((command) => this.client.execute(command)),
    );

    return results as any;
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

    const result = await this.client.execute(
      DeleteFilesCommand({ keys, ...opts }),
    );
    if (result.error) throw result.error;
    return result.data;
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

    const result = await this.client.execute(
      GetFileUrlsCommand({ keys, ...opts }),
    );
    if (result.error) throw result.error;
    return result.data;
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

    const result = await this.client.execute(ListFilesCommand({ ...opts }));
    if (result.error) throw result.error;
    return result.data;
  };

  renameFiles = async (updates: RenameFileUpdate | RenameFileUpdate[]) => {
    guardServerOnly();

    const result = await this.client.execute(RenameFilesCommand({ updates }));
    if (result.error) throw result.error;
    return result.data;
  };

  getUsageInfo = async () => {
    guardServerOnly();

    const result = await this.client.execute(GetUsageInfoCommand());
    if (result.error) throw result.error;
    return result.data;
  };

  /** Request a presigned url for a private file(s) */
  getSignedURL = async (
    key: string,
    opts?: Omit<typeof GetSignedURLOptions.Encoded, "key">,
  ) => {
    guardServerOnly();

    const result = await this.client.execute(
      GetSignedURLCommand({ key, ...opts }),
    );
    if (result.error) throw result.error;
    return result.data;
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
    opts?: Omit<UpdateACLOptions, "keys" | "acl">,
  ) => {
    guardServerOnly();

    const result = await this.client.execute(
      UpdateACLCommand({ keys, acl, ...opts }),
    );
    if (result.error) throw result.error;
    return result.data;
  };
}
