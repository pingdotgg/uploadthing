import type { Json } from "@uploadthing/shared";

import type { MaybePromise } from "./types";

/**
 * TODO: Do we wanna support effect/schema parsers now??
 */

// Don't want to use Zod cause it's an optional dependency
export type ParseFn<TType> = (input: unknown) => MaybePromise<TType>;
export type ParserZodEsque<TInput, TParsedInput extends Json> = {
  _input: TInput;
  _output: TParsedInput; // if using .transform etc
  parse: ParseFn<TParsedInput>;
};

// In case we add support for more parsers later
export type JsonParser = ParserZodEsque<Json, Json>;

export function getParseFn<TParser extends JsonParser>(
  parser: TParser,
): ParseFn<TParser["_output"]> {
  if (typeof parser.parse === "function") {
    return parser.parse;
  }

  throw new Error("Invalid parser");
}
