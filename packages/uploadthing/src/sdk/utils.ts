import { HttpClient, HttpClientRequest } from "@effect/platform";
import * as Effect from "effect/Effect";
import * as Predicate from "effect/Predicate";

import {
  generateKey,
  generateSignedURL,
  UploadThingError,
} from "@uploadthing/shared";
import type {
  ACL,
  ContentDisposition,
  Json,
  MaybeUrl,
  SerializedUploadThingError,
} from "@uploadthing/shared";

import { IngestUrl, UTToken } from "../_internal/config";
import { uploadWithoutProgress } from "../_internal/upload-server";
import type { UploadedFileData } from "../types";
import type { FileEsque, UrlWithOverrides } from "./types";
import { UTFile } from "./ut-file";

export function guardServerOnly() {
  if (typeof window !== "undefined") {
    throw new UploadThingError({
      code: "INTERNAL_SERVER_ERROR",
      message: "The `utapi` can only be used on the server.",
    });
  }
}

export const downloadFile = (
  _url: MaybeUrl | UrlWithOverrides,
): Effect.Effect<UTFile, SerializedUploadThingError, HttpClient.HttpClient> =>
  Effect.gen(function* () {
    let url = Predicate.isRecord(_url) ? _url.url : _url;
    if (typeof url === "string") {
      // since dataurls will result in name being too long, tell the user
      // to use uploadFiles instead.
      if (url.startsWith("data:")) {
        return yield* Effect.fail({
          code: "BAD_REQUEST",
          message:
            "Please use uploadFiles() for data URLs. uploadFilesFromUrl() is intended for use with remote URLs only.",
          data: undefined,
        } satisfies SerializedUploadThingError);
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
        return {
          code: "BAD_REQUEST",
          message: `Failed to download requested file: ${cause.message}`,
          data: cause.toJSON() as Json,
        } satisfies SerializedUploadThingError;
      }),
      Effect.scoped,
    );

    return new UTFile([arrayBuffer], name, {
      customId,
      lastModified: Date.now(),
    });
  }).pipe(Effect.withLogSpan("downloadFile"));

const generatePresignedUrl = (
  file: FileEsque,
  cd: ContentDisposition,
  acl: ACL | undefined,
) =>
  Effect.gen(function* () {
    const { apiKey, appId } = yield* UTToken;
    const baseUrl = yield* IngestUrl;

    const key = yield* generateKey(file, appId);

    const url = yield* generateSignedURL(`${baseUrl}/${key}`, apiKey, {
      // ttlInSeconds: routeOptions.presignedURLTTL,
      data: {
        "x-ut-identifier": appId,
        "x-ut-file-name": file.name,
        "x-ut-file-size": file.size,
        "x-ut-file-type": file.type,
        "x-ut-custom-id": file.customId,
        "x-ut-content-disposition": cd,
        "x-ut-acl": acl,
      },
    });
    return { url, key };
  }).pipe(Effect.withLogSpan("generatePresignedUrl"));

export const uploadFile = (
  file: FileEsque,
  opts: {
    contentDisposition?: ContentDisposition | undefined;
    acl?: ACL | undefined;
  },
): Effect.Effect<
  UploadedFileData,
  SerializedUploadThingError,
  HttpClient.HttpClient
> =>
  Effect.gen(function* () {
    const presigned = yield* generatePresignedUrl(
      file,
      opts.contentDisposition ?? "inline",
      opts.acl,
    ).pipe(
      Effect.catchTag("ConfigError", () =>
        Effect.fail({
          code: "INVALID_SERVER_CONFIG",
          message: "Failed to generate presigned URL",
        } satisfies SerializedUploadThingError),
      ),
    );
    const response = yield* uploadWithoutProgress(file, presigned).pipe(
      Effect.catchTag("ResponseError", (e) =>
        Effect.fail({
          code: "UPLOAD_FAILED",
          message: "Failed to upload file",
          data: e.toJSON() as Json,
        } satisfies SerializedUploadThingError),
      ),
    );

    return {
      key: presigned.key,
      url: response.url,
      appUrl: response.appUrl,
      lastModified: file.lastModified ?? Date.now(),
      name: file.name,
      size: file.size,
      type: file.type,
      customId: file.customId ?? null,
      fileHash: response.fileHash,
    };
  }).pipe(Effect.withLogSpan("uploadFile"));
