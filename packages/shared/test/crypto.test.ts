import { it } from "@effect/vitest";
import * as Effect from "effect/Effect";
import * as Redacted from "effect/Redacted";
import { describe, expect } from "vitest";

import {
  generateKey,
  generateSignedURL,
  signPayload,
  verifyKey,
  verifySignature,
} from "../src/crypto";
import type { ExtractHashPartsFn } from "../src/types";

describe("crypto sign / verify", () => {
  it.effect("signs and verifies a payload", () =>
    Effect.gen(function* () {
      const secret = Redacted.make("foo-123");
      const payload = "hello world";

      const sig = yield* signPayload(payload, secret);
      const verified = yield* verifySignature(payload, sig, secret);

      expect(verified).toBe(true);
    }),
  );

  it.effect("doesn't verify a payload with a bad signature", () =>
    Effect.gen(function* () {
      const secret = Redacted.make("foo-123");
      const payload = "hello world";

      const sig = yield* signPayload(payload, secret);
      const verified = yield* verifySignature(payload, sig + "bad", secret);

      expect(verified).toBe(false);
    }),
  );

  it.effect("doesn't verify a payload with a bad secret", () =>
    Effect.gen(function* () {
      const secret = Redacted.make("foo-123");
      const payload = "hello world";

      const sig = yield* signPayload(payload, secret);
      const verified = yield* verifySignature(
        payload,
        sig,
        Redacted.make("bad"),
      );

      expect(verified).toBe(false);
    }),
  );

  it.effect("generates a signed URL", () =>
    Effect.gen(function* () {
      const url = "https://example.com";
      const secret = Redacted.make("foo-123");

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
      const secret = Redacted.make("foo-123");

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
      const appI = "foo-123";

      const key = yield* generateKey(
        {
          name: "foo.txt",
          size: 123,
          type: "text/plain",
          lastModified: Date.now(),
        },
        appI,
      );

      expect(key).toBeTruthy();
    }),
  );

  it.effect("verifies a key", () =>
    Effect.gen(function* () {
      const appI = "foo-123";
      const key = yield* generateKey(
        {
          name: "foo.txt",
          size: 123,
          type: "text/plain",
          lastModified: Date.now(),
        },
        appI,
      );

      const verified = yield* verifyKey(key, appI);
      expect(verified).toBe(true);
    }),
  );

  it.effect("doesn't verify a key with a bad appI", () =>
    Effect.gen(function* () {
      const appI = "foo-123";
      const key = yield* generateKey(
        {
          name: "foo.txt",
          size: 123,
          type: "text/plain",
          lastModified: Date.now(),
        },
        appI,
      );

      const verified = yield* verifyKey(key, "bad");
      expect(verified).toBe(false);
    }),
  );

  it.effect("doesn't verify a key with a bad key", () =>
    Effect.gen(function* () {
      const appId = "foo-123";
      const key = yield* generateKey(
        {
          name: "foo.txt",
          size: 123,
          type: "text/plain",
          lastModified: Date.now(),
        },
        appId,
      );

      const verified = yield* verifyKey("badseed" + key.substring(7), appId);
      expect(verified).toBe(false);
    }),
  );

  it.effect("verifies with a custom hash function", () =>
    Effect.gen(function* () {
      const appI = "foo-123";
      const key = yield* generateKey(
        {
          name: "foo.txt",
          size: 123,
          type: "text/plain",
          lastModified: Date.now(),
        },
        appI,
        (file) => [file.name],
      );

      const verified = yield* verifyKey(key, appI);
      expect(verified).toBe(true);
    }),
  );

  it.effect("works even when there's nothing to seed", () =>
    Effect.gen(function* () {
      const appI = "foo-123";
      const key = yield* generateKey(
        {
          name: "foo.txt",
          size: 123,
          type: "text/plain",
          lastModified: Date.now(),
        },
        appI,
        () => [],
      );

      const verified = yield* verifyKey(key, appI);
      expect(verified).toBe(true);
    }),
  );

  it.effect(
    "custom hashFn returning a single number generates a valid key",
    () =>
      Effect.gen(function* () {
        const appI = "foo-123";
        const key = yield* generateKey(
          {
            name: "foo.txt",
            size: 123,
            type: "text/plain",
            lastModified: 1000,
          },
          appI,
          (file) => [file.name],
          () => 42,
        );

        expect(key).toBeTruthy();
        const verified = yield* verifyKey(key, appI);
        expect(verified).toBe(true);
      }),
  );

  it.effect(
    "custom hashFn returning an array of numbers generates a valid key",
    () =>
      Effect.gen(function* () {
        const appI = "foo-123";
        const key = yield* generateKey(
          {
            name: "foo.txt",
            size: 123,
            type: "text/plain",
            lastModified: 1000,
          },
          appI,
          (file) => [file.name],
          () => [111, 222, 333, 444],
        );

        expect(key).toBeTruthy();
        const verified = yield* verifyKey(key, appI);
        expect(verified).toBe(true);
      }),
  );

  it.effect("different hashFn outputs produce different keys", () =>
    Effect.gen(function* () {
      const appI = "foo-123";
      const file = {
        name: "foo.txt",
        size: 123,
        type: "text/plain",
        lastModified: 1000,
      };
      const hashParts: ExtractHashPartsFn = (f) => [f.name];

      const key1 = yield* generateKey(file, appI, hashParts, () => 100);
      const key2 = yield* generateKey(file, appI, hashParts, () => 999);

      expect(key1).not.toBe(key2);
    }),
  );
});
