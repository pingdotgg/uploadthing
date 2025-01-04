import type * as Standard from "@standard-schema/spec";
import * as Cause from "effect/Cause";
import * as Data from "effect/Data";
import * as Runtime from "effect/Runtime";
import * as Schema from "effect/Schema";

import type { Json } from "@uploadthing/shared";

export type ParseFn<TType> = (input: unknown) => Promise<TType>;

export type ParserZodEsque<TInput extends Json, TParsedInput> = {
  _input: TInput;
  _output: TParsedInput; // if using .transform etc
  parseAsync: ParseFn<TParsedInput>;
};

// In case we add support for more parsers later
export type JsonParser<In extends Json, Out = In> =
  | ParserZodEsque<In, Out>
  | Standard.StandardSchemaV1<In, Out>
  | Schema.Schema<Out, In>;

export class ParserError extends Data.TaggedError("ParserError")<{
  cause: unknown;
}> {
  message =
    "Input validation failed. The original error with it's validation issues is in the error cause.";
}

export function getParseFn<
  TOut extends Json,
  TParser extends JsonParser<any, TOut>,
>(parser: TParser): ParseFn<TOut> {
  if ("~standard" in parser) {
    /**
     * Standard Schema
     */
    return async (value) => {
      const result = await parser["~standard"].validate(value);
      if (result.issues) {
        throw new ParserError({ cause: result.issues });
      }
      return result.value;
    };
  }

  if ("parseAsync" in parser && typeof parser.parseAsync === "function") {
    /**
     * Zod
     * TODO (next major): Consider wrapping ZodError in ParserError
     */
    return parser.parseAsync;
  }

  if (Schema.isSchema(parser)) {
    /**
     * Effect Schema
     */
    return (value) =>
      Schema.decodeUnknownPromise(parser as Schema.Schema<any, TOut>)(
        value,
      ).catch((error) => {
        throw new ParserError({
          cause: Cause.squash(
            (error as Runtime.FiberFailure)[Runtime.FiberFailureCauseId],
          ),
        });
      });
  }

  throw new Error("Invalid parser");
}
