import * as S from "@effect/schema/Schema";
import { process } from "std-env";

import { UploadThingError } from "@uploadthing/shared";

export const getToken = (token?: string) => {
  if (token) return token;
  if (process.env.UPLOADTHING_TOKEN) return process.env.UPLOADTHING_TOKEN;
  return undefined;
};

export const getTokenOrThrow = (token?: string) => {
  const key = getToken(token);
  if (!key?.startsWith("sk_")) {
    throw new UploadThingError({
      code: "MISSING_ENV",
      message: "Missing or invalid API key. API keys must start with `sk_`.",
    });
  }
  return key;
};

export class UploadThingToken extends S.Class<UploadThingToken>(
  "UploadThingToken",
)({
  apiKey: S.String.pipe(S.startsWith("sk_")),
  appId: S.String,
  regions: S.Array(S.String),
}) {}

export const parseToken = (token: string) => {
  const parts = Buffer.from(token, "base64").toString("utf-8");
  return S.decode(S.parseJson(UploadThingToken))(parts);
};
