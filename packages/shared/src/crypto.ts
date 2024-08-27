import * as Encoding from "effect/Encoding";
import * as Hash from "effect/Hash";
import * as Micro from "effect/Micro";
import SQIds, { defaultOptions } from "sqids";

import { UploadThingError } from "./error";
import type { ExtractHashPartsFn, FileProperties, Time } from "./types";
import { parseTimeToSeconds } from "./utils";

const signaturePrefix = "hmac-sha256=";
const algorithm = { name: "HMAC", hash: "SHA-256" };
const encoder = new TextEncoder();

function shuffle(str: string, seed: string) {
  const chars = str.split("");
  const seedNum = Hash.string(seed);

  let temp: string;
  let j: number;
  for (let i = 0; i < chars.length; i++) {
    j = ((seedNum % (i + 1)) + i) % chars.length;
    temp = chars[i];
    chars[i] = chars[j];
    chars[j] = temp;
  }

  return chars.join("");
}

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
  }).pipe(Micro.withTrace("signPayload"));

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
  }).pipe(
    Micro.withTrace("verifySignature"),
    Micro.orElseSucceed(() => false),
  );

const KEY_SEPARATOR = "|";

export const generateKey = (
  file: FileProperties,
  apiKey: string,
  getHashParts?: ExtractHashPartsFn,
) =>
  Micro.sync(() => {
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

    // Hash and Encode the parts and apiKey as sqids
    const alphabet = shuffle(defaultOptions.alphabet, apiKey);
    const encodedFileSeed = new SQIds({ alphabet, minLength: 36 }).encode([
      Math.abs(Hash.string(hashParts)),
    ]);
    const encodedApiKey = new SQIds({ alphabet, minLength: 12 }).encode([
      Math.abs(Hash.string(apiKey)),
    ]);

    // Concatenate them and encode as base64
    return [encodedApiKey, encodedFileSeed].join(KEY_SEPARATOR);
  }).pipe(Micro.withTrace("generateKey"));

// Verify that the key was generated with the same apiKey
export const verifyKey = (key: string, apiKey: string) =>
  Micro.sync(() => {
    const given = key.split(KEY_SEPARATOR)[0];

    const alphabet = shuffle(defaultOptions.alphabet, apiKey);
    const expected = new SQIds({ alphabet, minLength: 12 }).encode([
      Math.abs(Hash.string(apiKey)),
    ]);

    // q: Does it need to be timing safe?
    return expected === given;
  }).pipe(
    Micro.withTrace("verifyKey"),
    Micro.orElseSucceed(() => false),
  );

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
  }).pipe(Micro.withTrace("generateSignedURL"));
