import * as S from "@effect/schema/Schema";
import * as Effect from "effect/Effect";
import * as Stream from "effect/Stream";

export const handleJsonLineStream =
  <TChunk>(
    schema: S.Schema<TChunk>,
    onChunk: (chunk: TChunk) => Effect.Effect<void>,
  ) =>
  <E, R>(stream: Stream.Stream<Uint8Array, E, R>) => {
    let buf = "";

    return stream.pipe(
      Stream.decodeText(),
      Stream.mapEffect((chunk) =>
        Effect.gen(function* () {
          buf += chunk;

          // Scan buffer for newlines
          const parts = buf.split("\n");
          const validChunks: unknown[] = [];

          for (const part of parts) {
            try {
              // Attempt to parse chunk as JSON
              validChunks.push(JSON.parse(part) as unknown);
              // Advance buffer if parsing succeeded
              buf = buf.slice(part.length + 1);
            } catch {
              //
            }
          }

          yield* Effect.logDebug("Received chunks").pipe(
            Effect.annotateLogs("chunk", chunk),
            Effect.annotateLogs("parsedChunks", validChunks),
            Effect.annotateLogs("buf", buf),
          );

          return validChunks;
        }),
      ),
      Stream.mapEffect(S.decodeUnknown(S.Array(schema))),
      Stream.mapEffect(Effect.forEach((part) => onChunk(part))),
      Stream.runDrain,
      Effect.withLogSpan("handleJsonLineStream"),
    );
  };
