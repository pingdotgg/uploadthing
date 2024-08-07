import { it } from "@effect/vitest";
import * as Effect from "effect/Effect";
import * as Exit from "effect/Exit";
import * as Stream from "effect/Stream";
import { beforeEach, describe, expect, vi } from "vitest";

import { signPayload } from "@uploadthing/shared";

import { handleJsonLineStream } from "./jsonl";
import { MetadataFetchStreamPart } from "./shared-schemas";

const te = new TextEncoder();

const createChunk = (_payload: unknown) => {
  const payload = JSON.stringify(_payload);
  return Effect.map(signPayload(payload, "sk_123"), (signature) =>
    JSON.stringify(
      MetadataFetchStreamPart.make({ payload, signature, hook: "callback" }),
    ),
  );
};

const sleep = (ms: number) => Effect.runPromise(Effect.sleep(ms));

const onChunk = vi.fn(Effect.succeed);
const onError = vi.fn();
beforeEach(() => {
  vi.restoreAllMocks();
});

describe("handleJsonLineStreaming", () => {
  it.effect(
    "parses chunks and calls onChunk for each with quick succession",
    () =>
      Effect.gen(function* () {
        const N_CHUNKS = 20;
        const chunks = yield* Effect.forEach(
          Array.from({ length: N_CHUNKS }),
          (_, i) => createChunk({ foo: "bar", i }),
        );

        const readable = new ReadableStream<Uint8Array>({
          start(controller) {
            for (const c of chunks) {
              controller.enqueue(te.encode(c));
            }
            controller.close();
          },
        });

        const exit = yield* handleJsonLineStream(
          MetadataFetchStreamPart,
          onChunk,
        )(Stream.fromReadableStream(() => readable, onError)).pipe(Effect.exit);

        expect(exit).toEqual(Exit.succeed(undefined));

        expect(onChunk).toHaveBeenCalledTimes(N_CHUNKS);
        expect(onChunk).toHaveBeenCalledWith(
          expect.objectContaining({
            payload: '{"foo":"bar","i":0}',
            hook: "callback",
          }),
        );
      }),
  );

  it.effect("handles payload with newlines", () =>
    Effect.gen(function* () {
      const chunk = yield* createChunk({ foo: "bar\nbaz" });
      const stream = new ReadableStream({
        async start(controller) {
          controller.enqueue(te.encode(chunk));
          controller.close();
        },
      });

      const exit = yield* handleJsonLineStream(
        MetadataFetchStreamPart,
        onChunk,
      )(Stream.fromReadableStream(() => stream, onError)).pipe(Effect.exit);

      expect(exit).toEqual(Exit.succeed(undefined));

      expect(onChunk).toHaveBeenCalledTimes(1);
      expect(onChunk).toHaveBeenCalledWith(
        expect.objectContaining({
          payload: '{"foo":"bar\\nbaz"}',
          hook: "callback",
        }),
      );
    }),
  );

  it.effect(
    "parses chunks and calls onChunk for each when they are delayed",
    () =>
      Effect.gen(function* () {
        const N_CHUNKS = 10;
        const chunks = yield* Effect.forEach(
          Array.from({ length: N_CHUNKS }),
          (_, i) => createChunk({ foo: "bar", i }),
        );

        const stream = new ReadableStream({
          async start(controller) {
            for await (const c of chunks) {
              await sleep(100);
              controller.enqueue(te.encode(c));
            }
            controller.close();
          },
        });

        const exit = yield* handleJsonLineStream(
          MetadataFetchStreamPart,
          onChunk,
        )(Stream.fromReadableStream(() => stream, onError)).pipe(Effect.exit);

        expect(exit).toEqual(Exit.succeed(undefined));

        expect(onChunk).toHaveBeenCalledTimes(N_CHUNKS);
        expect(onChunk).toHaveBeenCalledWith(
          expect.objectContaining({
            payload: '{"foo":"bar","i":0}',
            hook: "callback",
          }),
        );
      }),
  );

  it.effect("handles when chunks are not sent as a whole", () =>
    Effect.gen(function* () {
      const N_CHUNKS = 2;
      const chunks = yield* Effect.forEach(
        Array.from({ length: N_CHUNKS }),
        (_, i) => createChunk({ foo: "bar", i }),
      );

      const stream = new ReadableStream({
        async start(controller) {
          await Promise.allSettled(
            chunks.map(async (c) => {
              const firstHalf = c.slice(0, c.length / 2);
              controller.enqueue(te.encode(firstHalf));
              controller.enqueue(te.encode(c.slice(firstHalf.length)));
            }),
          );
          controller.close();
        },
      });

      const exit = yield* handleJsonLineStream(
        MetadataFetchStreamPart,
        onChunk,
      )(Stream.fromReadableStream(() => stream, onError)).pipe(Effect.exit);

      expect(exit).toEqual(Exit.succeed(undefined));

      expect(onChunk).toHaveBeenCalledTimes(N_CHUNKS);
      expect(onChunk).toHaveBeenCalledWith(
        expect.objectContaining({
          payload: '{"foo":"bar","i":0}',
          hook: "callback",
        }),
      );
    }),
  );

  it.effect("handles when chunks are concatenated", () =>
    Effect.gen(function* () {
      const N_CHUNKS = 5;
      const chunks = yield* Effect.forEach(
        Array.from({ length: N_CHUNKS }),
        (_, i) => createChunk({ foo: "bar", i }),
      );

      const stream = new ReadableStream({
        async start(controller) {
          controller.enqueue(te.encode(chunks.join("\n")));
          controller.close();
        },
      });

      const exit = yield* handleJsonLineStream(
        MetadataFetchStreamPart,
        onChunk,
      )(Stream.fromReadableStream(() => stream, onError)).pipe(Effect.exit);

      expect(exit).toEqual(Exit.succeed(undefined));

      expect(onChunk).toHaveBeenCalledTimes(N_CHUNKS);
      expect(onChunk).toHaveBeenCalledWith(
        expect.objectContaining({
          payload: '{"foo":"bar","i":0}',
          hook: "callback",
        }),
      );
    }),
  );
});
