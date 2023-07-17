import { generateUploadThingURL } from "@uploadthing/shared";

export const uploadFilesInternal = async (
  formData: FormData,
  opts: {
    apiKey: string;
    utVersion: string;
  },
) => {
  const res = await fetch(generateUploadThingURL("/api/uploadFiles"), {
    method: "POST",
    headers: {
      "x-uploadthing-api-key": opts.apiKey,
      "x-uploadthing-version": opts.utVersion,
    },
    cache: "no-store",
    body: formData,
  });

  const json = (await res.json()) as
    | { data: { key: string; url: string }[] }
    | { error: string };

  if (!res.ok || "error" in json) {
    const message = "error" in json ? json.error : "Unknown error";
    throw new Error(message);
  }

  return json.data;
};
