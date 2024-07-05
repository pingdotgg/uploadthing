import * as Encoding from "effect/Encoding";
import * as Micro from "effect/Micro";

import { UploadThingError } from "./error";
import type { ExtractHashPartsFn, FileProperties, Time } from "./types";
import { parseTimeToSeconds } from "./utils";

const signaturePrefix = "hmac-sha256=";
const algorithm = { name: "HMAC", hash: "SHA-256" };
const encoder = new TextEncoder();

const sha256Hex = (data: string) =>
  Micro.map(
    Micro.promise(() => crypto.subtle.digest("SHA-256", encoder.encode(data))),
    (arrayBuffer) => Encoding.encodeHex(new Uint8Array(arrayBuffer)),
  );

export const signPayload = (payload: string, secret: string) =>
  Micro.gen(function* () {
    const signingKey = yield* Micro.tryPromise({
      try: () =>
        crypto.subtle.importKey(
          "raw",
          encoder.encode(secret),
          algorithm,
          false,
          ["sign"],
        ),
      catch: (e) =>
        new UploadThingError({
          code: "BAD_REQUEST",
          message: "Invalid signing secret",
          cause: e,
        }),
    });

    const signature = yield* Micro.map(
      Micro.tryPromise({
        try: () =>
          crypto.subtle.sign(algorithm, signingKey, encoder.encode(payload)),
        catch: (e) => new UploadThingError({ code: "BAD_REQUEST", cause: e }),
      }),
      (arrayBuffer) => Encoding.encodeHex(new Uint8Array(arrayBuffer)),
    );

    return `${signaturePrefix}${signature}`;
  });

export const verifySignature = (
  payload: string,
  signature: string | null,
  secret: string,
) =>
  Micro.gen(function* () {
    const sig = signature?.slice(signaturePrefix.length);
    if (!sig) return false;

    const secretBytes = encoder.encode(secret);
    const signingKey = yield* Micro.promise(() =>
      crypto.subtle.importKey("raw", secretBytes, algorithm, false, ["verify"]),
    );

    const sigBytes = yield* Micro.fromEither(Encoding.decodeHex(sig));
    const payloadBytes = encoder.encode(payload);
    return yield* Micro.promise(() =>
      crypto.subtle.verify(algorithm, signingKey, sigBytes, payloadBytes),
    );
  }).pipe(Micro.orElseSucceed(() => false));

export const generateKey = (
  file: FileProperties,
  apiKey: string,
  getHashParts?: ExtractHashPartsFn,
) =>
  Micro.gen(function* () {
    // Get the parts of which we should hash to constuct the key
    // This allows the user to customize the hashing algorithm
    // If they for example want to generate the same key for the
    // same file whenever it was uploaded
    const hashParts = JSON.stringify(
      getHashParts?.(file) ?? [
        file.name,
        file.size,
        file.type,
        file.lastModified,
        Date.now(),
      ],
    );

    // Hash and Encode the parts and apiKey as hex strings
    const encodedFileSeed = yield* sha256Hex(hashParts);
    const encodedApiKey = yield* sha256Hex(apiKey);

    // Concatenate them and encode as base64
    return Encoding.encodeBase64([encodedApiKey, encodedFileSeed].join(":"));
  });

// Verify that the key was generated with the same apiKey
export const verifyKey = (key: string, apiKey: string) =>
  Micro.gen(function* () {
    const given = yield* Micro.map(
      Micro.fromEither(Encoding.decodeBase64String(key)),
      (text) => text.split(":")[0],
    );

    const expected = yield* sha256Hex(apiKey);

    // q: Does it need to be timing safe?
    return expected === given;
  }).pipe(Micro.orElseSucceed(() => false));

export const generateSignedURL = (
  url: string | URL,
  secretKey: string,
  opts: {
    ttlInSeconds?: Time | undefined;
    data?: Record<string, string | number | boolean | null | undefined>;
  },
) =>
  Micro.gen(function* () {
    const parsedURL = new URL(url);

    const ttl = opts.ttlInSeconds
      ? parseTimeToSeconds(opts.ttlInSeconds)
      : 60 * 60;

    const expirationTime = Date.now() + ttl * 1000;
    parsedURL.searchParams.append("expires", expirationTime.toString());

    if (opts.data) {
      Object.entries(opts.data).forEach(([key, value]) => {
        if (value == null) return;
        const encoded = encodeURIComponent(value);
        parsedURL.searchParams.append(key, encoded);
      });
    }

    const signature = yield* signPayload(parsedURL.toString(), secretKey);
    parsedURL.searchParams.append("signature", signature);

    return parsedURL.href;
  });
