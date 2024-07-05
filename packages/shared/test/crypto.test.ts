import { it } from "@effect/vitest";
import * as Effect from "effect/Effect";
import * as Exit from "effect/Exit";
import { describe, expect } from "vitest";

import {
  generateKey,
  generateSignedURL,
  signPayload,
  verifyKey,
  verifySignature,
} from "../src/crypto";

describe("crypto sign / verify", () => {
  it.effect("signs and verifies a payload", () =>
    Effect.gen(function* () {
      const secret = "foo-123";
      const payload = "hello world";

      const sig = yield* signPayload(payload, secret);
      const verified = yield* verifySignature(payload, sig, secret);

      expect(verified).toBe(true);
    }),
  );

  it.effect("doesn't verify a payload with a bad signature", () =>
    Effect.gen(function* () {
      const secret = "foo-123";
      const payload = "hello world";

      const sig = yield* signPayload(payload, secret);
      const verified = yield* verifySignature(payload, sig + "bad", secret);

      expect(verified).toBe(false);
    }),
  );

  it.effect("doesn't verify a payload with a bad secret", () =>
    Effect.gen(function* () {
      const secret = "foo-123";
      const payload = "hello world";

      const sig = yield* signPayload(payload, secret);
      const verified = yield* verifySignature(payload, sig, "bad");

      expect(verified).toBe(false);
    }),
  );

  it.effect("generates a signed URL", () =>
    Effect.gen(function* () {
      const url = "https://example.com";
      const secret = "foo-123";

      const signedURL = yield* generateSignedURL(url, secret, {
        ttlInSeconds: 60 * 60,
        data: { foo: "bar" },
      });

      expect(signedURL).toContain("expires=");
      expect(signedURL).toContain("foo=bar");
      expect(signedURL).toContain("signature=");
    }),
  );

  it.effect("generates and verifies a signed URL", () =>
    Effect.gen(function* () {
      const url = "https://example.com";
      const secret = "foo-123";

      const signedURL = yield* generateSignedURL(url, secret, {
        ttlInSeconds: 60 * 60,
        data: { foo: "bar" },
      });

      const asUrl = new URL(signedURL);
      const sig = asUrl.searchParams.get("signature");
      asUrl.searchParams.delete("signature");

      const verified = yield* verifySignature(asUrl.href, sig, secret);
      expect(verified).toBe(true);
    }),
  );
});

describe("key gen", () => {
  it.effect("generates a key", () =>
    Effect.gen(function* () {
      const apiKey = "foo-123";

      const key = yield* generateKey(
        {
          name: "foo.txt",
          size: 123,
          type: "text/plain",
          lastModified: Date.now(),
        },
        apiKey,
      );

      console.log(key);
      expect(key).toBeTruthy();
    }),
  );

  it.effect("verifies a key", () =>
    Effect.gen(function* () {
      const apiKey = "foo-123";
      const key = yield* generateKey(
        {
          name: "foo.txt",
          size: 123,
          type: "text/plain",
          lastModified: Date.now(),
        },
        apiKey,
      );

      const verified = yield* verifyKey(key, apiKey);
      expect(verified).toBe(true);
    }),
  );

  it.effect("doesn't verify a key with a bad apiKey", () =>
    Effect.gen(function* () {
      const apiKey = "foo-123";
      const key = yield* generateKey(
        {
          name: "foo.txt",
          size: 123,
          type: "text/plain",
          lastModified: Date.now(),
        },
        apiKey,
      );

      const verified = yield* verifyKey(key, "bad");
      expect(verified).toBe(false);
    }),
  );

  it.effect("doesn't verify a key with a bad key", () =>
    Effect.gen(function* () {
      const apiKey = "foo-123";
      const key = yield* generateKey(
        {
          name: "foo.txt",
          size: 123,
          type: "text/plain",
          lastModified: Date.now(),
        },
        apiKey,
      );

      const verified = yield* verifyKey("badseed" + key.substring(7), apiKey);
      expect(verified).toBe(false);
    }),
  );

  it.effect("verifies with a custom hash function", () =>
    Effect.gen(function* () {
      const apiKey = "foo-123";
      const key = yield* generateKey(
        {
          name: "foo.txt",
          size: 123,
          type: "text/plain",
          lastModified: Date.now(),
        },
        apiKey,
        (file) => [file.name],
      );

      const verified = yield* verifyKey(key, apiKey);
      expect(verified).toBe(true);
    }),
  );

  it.effect("works even when there's nothing to seed", () =>
    Effect.gen(function* () {
      const apiKey = "foo-123";
      const key = yield* generateKey(
        {
          name: "foo.txt",
          size: 123,
          type: "text/plain",
          lastModified: Date.now(),
        },
        apiKey,
        () => [],
      );

      const verified = yield* verifyKey(key, apiKey);
      expect(verified).toBe(true);
    }),
  );
});
