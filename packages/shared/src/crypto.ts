import type { ExtractHashPartsFn, FileProperties } from "./types";

const signaturePrefix = "hmac-sha256=";
const algorithm = { name: "HMAC", hash: "SHA-256" };

export const signPayload = async (payload: string, secret: string) => {
  const encoder = new TextEncoder();
  const signingKey = await crypto.subtle.importKey(
    "raw",
    encoder.encode(secret),
    algorithm,
    false,
    ["sign"],
  );

  const signature = await crypto.subtle
    .sign(algorithm, signingKey, encoder.encode(payload))
    .then((sig) => Buffer.from(sig).toString("hex"));

  return `${signaturePrefix}${signature}`;
};

export const verifySignature = async (
  payload: string,
  signature: string | null,
  secret: string,
) => {
  const sig = signature?.slice(signaturePrefix.length);
  if (!sig) return false;

  const encoder = new TextEncoder();
  const signingKey = await crypto.subtle.importKey(
    "raw",
    encoder.encode(secret),
    algorithm,
    false,
    ["verify"],
  );
  return await crypto.subtle.verify(
    algorithm,
    signingKey,
    Uint8Array.from(Buffer.from(sig, "hex")),
    encoder.encode(payload),
  );
};

export const generateKey = async (
  file: FileProperties,
  getHashParts?: ExtractHashPartsFn,
) => {
  const hashParts = getHashParts?.(file) ?? [
    file.name,
    file.size,
    file.type,
    file.lastModified,
    Date.now(),
  ];
  const jsonString = JSON.stringify(hashParts);
  const buffer = new TextEncoder().encode(jsonString);
  const hashBuffer = await crypto.subtle.digest("SHA-256", buffer);
  const hex = Array.from(new Uint8Array(hashBuffer))
    .map((byte) => byte.toString(16).padStart(2, "0"))
    .join("");
  return hex;
};

export const generateSignedURL = async (
  url: string | URL,
  secretKey: string,
  opts: {
    ttlInSeconds: number;
    data?: Record<string, string | number | boolean | null | undefined>;
  },
) => {
  const parsedURL = new URL(url);

  const expirationTime = Date.now() + opts.ttlInSeconds * 1000;
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
    await signPayload(parsedURL.toString(), secretKey),
  );

  return parsedURL.href;
};
