import { HttpClient, HttpClientRequest } from "@effect/platform";
import { Effect, Predicate } from "effect";

import { UploadThingError } from "@uploadthing/shared";
import type { Json, MaybeUrl } from "@uploadthing/shared";

import type { Command } from "../types";
import { UTFile } from "../ut-file";
import { uploadFile } from "../utils";
import type { BaseUploadOptions, UploadFileResult } from "./upload-files";

export interface UploadFileFromUrlOptions extends BaseUploadOptions {
  /**
   * The URL to upload from.
   */
  url: MaybeUrl | UrlWithOverrides;
}

export interface UploadFilesFromUrlOptions extends BaseUploadOptions {
  /**
   * The URLs to upload from.
   */
  urls: (MaybeUrl | UrlWithOverrides)[];
}

export type UrlWithOverrides = {
  url: MaybeUrl;
  name?: string;
  customId?: string;
};

export const UploadFilesFromUrlCommand = Effect.fn("UploadFilesFromUrlCommand")(
  function* <
    Options extends UploadFileFromUrlOptions | UploadFilesFromUrlOptions,
  >(options: Options) {
    const urls = "url" in options ? [options.url] : options.urls;

    const result = yield* Effect.forEach(urls, (url) =>
      downloadFile(url).pipe(
        Effect.flatMap((file) =>
          uploadFile(file, options.contentDisposition, options.acl),
        ),
        Effect.match({
          onSuccess: (data) => ({ data, error: null }),
          onFailure: (error) => ({ data: null, error }),
        }),
      ),
    )
      .pipe(
        Effect.map((ups) => ("urls" in options ? ups : ups[0]!)),
        Effect.tap((res) =>
          Effect.logDebug("Finished uploading").pipe(
            Effect.annotateLogs("uploadResult", res),
          ),
        ),
        Effect.withLogSpan("uploadFiles"),
      )
      .pipe(Effect.withLogSpan("uploadFilesFromUrl"));

    return result as Options extends UploadFileFromUrlOptions
      ? UploadFileResult
      : UploadFileResult[];
  },
) satisfies Command;

const downloadFile = (_url: MaybeUrl | UrlWithOverrides) =>
  Effect.gen(function* () {
    let url = Predicate.isRecord(_url) ? _url.url : _url;
    if (typeof url === "string") {
      // since dataurls will result in name being too long, tell the user
      // to use uploadFiles instead.
      if (url.startsWith("data:")) {
        return yield* new UploadThingError({
          code: "BAD_REQUEST",
          message:
            "Please use uploadFiles() for data URLs. uploadFilesFromUrl() is intended for use with remote URLs only.",
          data: undefined,
        });
      }
    }
    url = new URL(url);

    const {
      name = url.pathname.split("/").pop() ?? "unknown-filename",
      customId = undefined,
    } = Predicate.isRecord(_url) ? _url : {};
    const httpClient = (yield* HttpClient.HttpClient).pipe(
      HttpClient.filterStatusOk,
    );

    const arrayBuffer = yield* HttpClientRequest.get(url).pipe(
      HttpClientRequest.modify({ headers: {} }),
      httpClient.execute,
      Effect.flatMap((_) => _.arrayBuffer),
      Effect.mapError((cause) => {
        return new UploadThingError({
          code: "BAD_REQUEST",
          message: `Failed to download requested file: ${cause.message}`,
          data: cause.toJSON() as Json,
        });
      }),
      Effect.scoped,
    );

    return new UTFile([arrayBuffer], name, {
      customId,
      lastModified: Date.now(),
    });
  }).pipe(Effect.withLogSpan("downloadFile"));
