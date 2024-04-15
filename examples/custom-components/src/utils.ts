import { z } from "zod";

import { FileWithState } from "@uploadthing/shared";

export const fileWithStateValidator = z.custom<FileWithState>((value) => {
  if (!(value instanceof File)) return false;
  return "status" in value && "url" in value;
});
