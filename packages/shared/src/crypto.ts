import * as Micro from "effect/Micro";

import { UploadThingError } from "./error";
import type { ExtractHashPartsFn, FileProperties, Time } from "./types";
import { parseTimeToSeconds } from "./utils";

const signaturePrefix = "hmac-sha256=";
const algorithm = { name: "HMAC", hash: "SHA-256" };

export const signPayload = (payload: string, secret: string) =>
  Micro.gen(function* () {
    const encoder = new TextEncoder();

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
    const signature = yield* Micro.tryPromise({
      try: () =>
        crypto.subtle
          .sign(algorithm, signingKey, encoder.encode(payload))
          .then((sig) => Buffer.from(sig).toString("hex")),
      catch: (e) => new UploadThingError({ code: "BAD_REQUEST", cause: e }),
    });

    return `${signaturePrefix}${signature}`;
  });

export const verifySignature = (
  payload: string | Promise<string>,
  signature: string | null,
  secret: string,
) =>
  Micro.gen(function* () {
    const sig = signature?.slice(signaturePrefix.length);
    if (!sig) return false;

    const encoder = new TextEncoder();
    const signingKey = yield* Micro.tryPromise({
      try: () =>
        crypto.subtle.importKey(
          "raw",
          encoder.encode(secret),
          algorithm,
          false,
          ["verify"],
        ),
      catch: (e) =>
        new UploadThingError({
          code: "BAD_REQUEST",
          message: "Invalid verification secret",
          cause: e,
        }),
    });
    return yield* Micro.promise(async () =>
      crypto.subtle
        .verify(
          algorithm,
          signingKey,
          Uint8Array.from(Buffer.from(sig, "hex")),
          encoder.encode(await payload),
        )
        .catch(() => false),
    );
  });

export const generateKey = (
  file: FileProperties,
  getHashParts?: ExtractHashPartsFn,
) =>
  Micro.gen(function* () {
    const hashParts = getHashParts?.(file) ?? [
      file.name,
      file.size,
      file.type,
      file.lastModified,
      Date.now(),
    ];
    const buffer = new TextEncoder().encode(JSON.stringify(hashParts));
    const hash = yield* Micro.promise(() =>
      crypto.subtle.digest("SHA-256", buffer),
    );
    return Array.from(new Uint8Array(hash))
      .map((byte) => byte.toString(16).padStart(2, "0"))
      .join("");
  });

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
