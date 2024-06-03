import { z } from "zod";

import { FileWithState } from "uploadthing/types";

export const fileWithStateValidator = z.custom<FileWithState>((value) => {
  if (!(value instanceof File)) return false;
  return "status" in value && value.status === "uploaded";
}, "File must be uploaded");
