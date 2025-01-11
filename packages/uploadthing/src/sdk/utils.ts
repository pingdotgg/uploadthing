import {
  HttpClient,
  HttpClientRequest,
  HttpClientResponse,
} from "@effect/platform";
import type { Schema } from "effect";
import { Effect, Redacted } from "effect";

import {
  generateKey,
  generateSignedURL,
  UploadThingError,
} from "@uploadthing/shared";
import type { ACL, ContentDisposition, Json } from "@uploadthing/shared";

import {
  ApiUrl,
  IngestUrl,
  UPLOADTHING_VERSION,
  UTToken,
} from "../_internal/config";
import { logHttpClientError, logHttpClientResponse } from "../_internal/logger";
import { uploadWithoutProgress } from "../_internal/upload-server";
import type { FileEsque } from "./commands/upload-files";

export const makeUploadThingApiRequest = Effect.fn("requestUploadThing")(
  function* <TInput, TOutput, TTransformedOutput>(
    pathname: `/${string}`,
    body: TInput,
    responseSchema: Schema.Schema<TTransformedOutput, TOutput>,
  ) {
    const { apiKey } = yield* UTToken;
    const baseUrl = yield* ApiUrl;
    const httpClient = (yield* HttpClient.HttpClient).pipe(
      HttpClient.filterStatusOk,
    );

    yield* Effect.annotateCurrentSpan("baseUrl", baseUrl);
    yield* Effect.annotateCurrentSpan("pathname", pathname);
    yield* Effect.annotateCurrentSpan("input", body);

    const output = yield* HttpClientRequest.post(pathname).pipe(
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

    yield* Effect.annotateCurrentSpan("output", output);

    return output;
  },
  Effect.catchTags({
    // TODO: HANDLE THESE PROPERLY
    ConfigError: (e) => Effect.die(e),
    RequestError: (e) => Effect.die(e),
    ResponseError: (e) => Effect.die(e),
    ParseError: (e) => Effect.die(e),
  }),
);

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
  contentDisposition?: ContentDisposition | undefined,
  acl?: ACL | undefined,
) =>
  Effect.gen(function* () {
    const presigned = yield* generatePresignedUrl(
      file,
      contentDisposition ?? "inline",
      acl,
    ).pipe(
      Effect.catchTag(
        "ConfigError",
        () =>
          new UploadThingError({
            code: "INVALID_SERVER_CONFIG",
            message: "Failed to generate presigned URL",
          }),
      ),
    );
    const response = yield* uploadWithoutProgress(file, presigned).pipe(
      Effect.catchTag(
        "ResponseError",
        (e) =>
          new UploadThingError({
            code: "UPLOAD_FAILED",
            message: "Failed to upload file",
            data: e.toJSON() as Json,
          }),
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
