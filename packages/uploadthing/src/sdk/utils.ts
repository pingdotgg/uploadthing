import {
  HttpClient,
  HttpClientRequest,
  HttpClientResponse,
} from "@effect/platform";
import * as Effect from "effect/Effect";

import {
  generateKey,
  generateSignedURL,
  isObject,
  UploadThingError,
} from "@uploadthing/shared";
import type {
  ACL,
  ContentDisposition,
  MaybeUrl,
  SerializedUploadThingError,
} from "@uploadthing/shared";

import { IngestUrl, UTToken } from "../internal/config";
import { uploadWithoutProgress } from "../internal/upload.server";
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

type UploadFilesInternalOptions = {
  files: FileEsque[];
  contentDisposition: ContentDisposition;
  acl: ACL | undefined;
};

export const uploadFilesInternal = (input: UploadFilesInternalOptions) =>
  getPresignedUrls(input).pipe(
    Effect.andThen((presigneds) =>
      Effect.forEach(
        presigneds,
        (file) =>
          uploadFile(file).pipe(
            Effect.tapError((error) =>
              Effect.logError("Upload failed").pipe(
                Effect.annotateLogs("error", error),
              ),
            ),
            Effect.match({
              onFailure: (error) => ({
                data: null,
                error: UploadThingError.toObject(
                  error instanceof UploadThingError
                    ? error
                    : new UploadThingError({
                        message: "Failed to upload file.",
                        code: "BAD_REQUEST",
                        cause: error,
                      }),
                ),
              }),
              onSuccess: (data: UploadedFileData) => ({ data, error: null }),
            }),
          ),
        { concurrency: 10 },
      ),
    ),
  );

/**
 * FIXME: downloading everything into memory and then upload
 * isn't the best. We should support streams so we can download
 * just as much as we need at any time.
 */
export const downloadFiles = (
  urls: (MaybeUrl | UrlWithOverrides)[],
  downloadErrors: Record<number, SerializedUploadThingError>,
) =>
  Effect.forEach(
    urls,
    (_url, idx) =>
      Effect.gen(function* () {
        let url = isObject(_url) ? _url.url : _url;
        if (typeof url === "string") {
          // since dataurls will result in name being too long, tell the user
          // to use uploadFiles instead.
          if (url.startsWith("data:")) {
            downloadErrors[idx] = UploadThingError.toObject(
              new UploadThingError({
                code: "BAD_REQUEST",
                message:
                  "Please use uploadFiles() for data URLs. uploadFilesFromUrl() is intended for use with remote URLs only.",
              }),
            );
            return null;
          }
        }
        url = new URL(url);

        const {
          name = url.pathname.split("/").pop() ?? "unknown-filename",
          customId = undefined,
        } = isObject(_url) ? _url : {};

        const arrayBuffer = yield* HttpClientRequest.get(url).pipe(
          HttpClientRequest.modify({ headers: {} }),
          HttpClient.filterStatusOk(yield* HttpClient.HttpClient),
          HttpClientResponse.arrayBuffer,
          Effect.mapError((error) => {
            downloadErrors[idx] = UploadThingError.toObject(
              new UploadThingError({
                code: "BAD_REQUEST",
                message: "Failed to download requested file.",
                cause: error,
              }),
            );
            return Effect.succeed(undefined);
          }),
        );

        return new UTFile([arrayBuffer], name, {
          customId,
          lastModified: Date.now(),
        });
      }).pipe(Effect.withLogSpan("downloadFile")),
    { concurrency: 10 },
  );

const getPresignedUrls = (input: UploadFilesInternalOptions) =>
  Effect.gen(function* () {
    const { files, contentDisposition, acl } = input;

    yield* Effect.logDebug("Generating presigned URLs for files").pipe(
      Effect.annotateLogs("files", files),
    );

    const { apiKey, appId } = yield* UTToken;
    const baseUrl = yield* IngestUrl;

    const presigneds = yield* Effect.forEach(files, (file) =>
      Effect.gen(function* () {
        const key = yield* generateKey(file, apiKey);

        const url = yield* generateSignedURL(`${baseUrl}/${key}`, apiKey, {
          // ttlInSeconds: routeOptions.presignedURLTTL,
          data: {
            "x-ut-identifier": appId,
            "x-ut-file-name": file.name,
            "x-ut-file-size": file.size,
            "x-ut-file-type": file.type,
            "x-ut-custom-id": file.customId,
            "x-ut-content-disposition": contentDisposition,
            "x-ut-acl": acl,
          },
        });
        return { url, key };
      }),
    );

    yield* Effect.logDebug("Generated presigned URLs").pipe(
      Effect.annotateLogs("presigneds", presigneds),
    );

    return files.map((file, i) => ({
      file,
      presigned: presigneds[i],
    }));
  }).pipe(Effect.withLogSpan("getPresignedUrls"));

const uploadFile = (
  input: Effect.Effect.Success<ReturnType<typeof getPresignedUrls>>[number],
) =>
  Effect.gen(function* () {
    const { file, presigned } = input;

    const { url } = yield* uploadWithoutProgress(file, presigned);

    return {
      key: presigned.key,
      url: url,
      lastModified: file.lastModified ?? Date.now(),
      name: file.name,
      size: file.size,
      type: file.type,
      customId: file.customId ?? null,
    };
  }).pipe(Effect.withLogSpan("uploadFile"));
