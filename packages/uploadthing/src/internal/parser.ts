import type { v1 } from "@standard-schema/spec";
import * as Schema from "effect/Schema";

import type { Json } from "@uploadthing/shared";

/**
 * TODO: Do we wanna support effect/schema parsers now??
 */

export type ParseFn<TType> = (input: unknown) => Promise<TType>;

export type ParserZodEsque<TInput, TParsedInput extends Json> = {
  _input: TInput;
  _output: TParsedInput; // if using .transform etc
  parseAsync: ParseFn<TParsedInput>;
};

export type ParserStandardSchemaEsque<TInput, TParsedInput> = v1.StandardSchema<
  TInput,
  TParsedInput
>;

// In case we add support for more parsers later
export type JsonParser<In extends Json = Json, Out extends Json = Json> =
  | ParserZodEsque<In, Out>
  | ParserStandardSchemaEsque<In, Out>
  | Schema.Schema<In, Out>;

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
        throw new Error(
          "Input validation failed. See validation issues in the error cause.",
          { cause: result.issues },
        );
      }
      return result.value;
    };
  }

  if ("parseAsync" in parser && typeof parser.parseAsync === "function") {
    /**
     * Zod
     */
    return parser.parseAsync;
  }

  if (Schema.isSchema(parser)) {
    /**
     * Effect Schema
     */
    return Schema.decodeUnknownPromise(parser as Schema.Schema<any, TOut>);
  }

  throw new Error("Invalid parser");
}
