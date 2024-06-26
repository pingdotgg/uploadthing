import * as Micro from "effect/Micro";

import type { ExtractHashPartsFn, FileProperties, Time } from "./types";
import { parseTimeToSeconds } from "./utils";

const signaturePrefix = "hmac-sha256=";
const algorithm = { name: "HMAC", hash: "SHA-256" };

export const signPayload = (payload: string, secret: string) =>
  Micro.gen(function* () {
    const encoder = new TextEncoder();

    const signingKey = yield* Micro.promise(() =>
      crypto.subtle.importKey("raw", encoder.encode(secret), algorithm, false, [
        "sign",
      ]),
    );
    const signature = yield* Micro.promise(() =>
      crypto.subtle
        .sign(algorithm, signingKey, encoder.encode(payload))
        .then((sig) => Buffer.from(sig).toString("hex")),
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

    const encoder = new TextEncoder();
    const signingKey = yield* Micro.promise(() =>
      crypto.subtle.importKey("raw", encoder.encode(secret), algorithm, false, [
        "verify",
      ]),
    );
    return yield* Micro.promise(() =>
      crypto.subtle.verify(
        algorithm,
        signingKey,
        Uint8Array.from(Buffer.from(sig, "hex")),
        encoder.encode(payload),
      ),
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

    parsedURL.searchParams.append(
      "signature",
      yield* signPayload(parsedURL.toString(), secretKey),
    );

    return parsedURL.href;
  });
