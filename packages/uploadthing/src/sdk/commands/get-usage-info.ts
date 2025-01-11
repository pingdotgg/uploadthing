import { Effect, Schema } from "effect";

import type { Command } from "../types";
import { makeUploadThingApiRequest } from "../utils";

export class GetUsageInfoResponse extends Schema.Class<GetUsageInfoResponse>(
  "GetUsageInfoResponse",
)({
  totalBytes: Schema.Number,
  appTotalBytes: Schema.Number,
  filesUploaded: Schema.Number,
  limitBytes: Schema.Number,
}) {}

export const GetUsageInfoCommand = Effect.fn("GetUsageInfoCommand")(
  function* () {
    const response = yield* makeUploadThingApiRequest(
      "/v6/getUsageInfo",
      {},
      GetUsageInfoResponse,
    );

    return response;
  },
) satisfies Command;
