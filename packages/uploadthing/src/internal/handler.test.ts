import { it } from "@effect/vitest";
import * as Effect from "effect/Effect";
import * as Logger from "effect/Logger";
import * as LogLevel from "effect/LogLevel";
import * as Stream from "effect/Stream";
import { delay, http } from "msw";
import { setupServer } from "msw/node";
import { afterAll, beforeAll, describe, expect, vi } from "vitest";

import { signPayload } from "@uploadthing/shared";

import { handleJsonLineStream } from "./handler";
import { MetadataFetchStreamPart } from "./shared-schemas";

const te = new TextEncoder();

const createChunk = (_payload: unknown) => {
  const payload = JSON.stringify(_payload);
  return Effect.map(signPayload(payload, "sk_123"), (signature) =>
    te.encode(
      JSON.stringify(
        MetadataFetchStreamPart.make({ payload, signature, hook: "callback" }),
      ),
    ),
  );
};

const msw = setupServer();
beforeAll(() => {
  msw.listen({ onUnhandledRequest: "bypass" });
});
afterAll(() => msw.close());

describe("handleJsonLineStreaming", () => {
  it.effect("parses chunks and calls onChunk for each", () =>
    Effect.gen(function* () {
      const N_CHUNKS = 20;
      const chunks = yield* Effect.forEach(
        Array.from({ length: N_CHUNKS }),
        (_, i) => createChunk({ foo: "bar", i }),
      );

      msw.use(
        http.post("https://my-api.com", async () => {
          await delay();
          const stream = new ReadableStream({
            async start(controller) {
              await Promise.allSettled(
                chunks.map(async (c) => {
                  if (Math.random() < 0.5) await delay();
                  controller.enqueue(c);
                }),
              );

              controller.close();
            },
          });
          return new Response(stream);
        }),
      );

      const onChunk = vi.fn((data) => {
        console.debug("onChunk", data);
        return Effect.succeed(data);
      });
      const onError = vi.fn(Effect.logError);

      const resp = yield* Effect.promise(() =>
        // eslint-disable-next-line no-restricted-globals
        fetch("https://my-api.com", { method: "POST" }),
      );

      const exit = yield* handleJsonLineStream(onChunk)(
        Stream.fromReadableStream(() => resp.body!, onError),
      ).pipe(Effect.exit);

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
