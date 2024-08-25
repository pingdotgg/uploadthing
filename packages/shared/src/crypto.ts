import * as Either from "effect/Either";
import * as Encoding from "effect/Encoding";

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
    .then((arrayBuffer) => Encoding.encodeHex(new Uint8Array(arrayBuffer)));

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
    Either.getOrThrow(Encoding.decodeHex(sig)),
    encoder.encode(payload),
  );
};
