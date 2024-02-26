import {
  generateUploadThingURL,
  pollForFileData,
  UploadThingError,
} from "@uploadthing/shared";
import type { FetchEsque, FileData, ResponseEsque } from "@uploadthing/shared";

import { UPLOADTHING_VERSION } from "../constants";
import { logger } from "./logger";

const isValidResponse = (response: ResponseEsque) => {
  if (!response.ok) return false;
  if (response.status >= 400) return false;
  if (!response.headers.has("x-uploadthing-version")) return false;

  return true;
};

export const conditionalDevServer = async (opts: {
  fileKey: string;
  apiKey: string;
  fetch: FetchEsque;
}) => {
  const fileData = await pollForFileData(
    {
      url: generateUploadThingURL(`/api/pollUpload/${opts.fileKey}`),
      apiKey: opts.apiKey,
      sdkVersion: UPLOADTHING_VERSION,
      fetch: opts.fetch,
    },
    async (json: { fileData: FileData }) => {
      const file = json.fileData;

      let callbackUrl = file.callbackUrl + `?slug=${file.callbackSlug}`;
      if (!callbackUrl.startsWith("http"))
        callbackUrl = "http://" + callbackUrl;

      logger.info("SIMULATING FILE UPLOAD WEBHOOK CALLBACK", callbackUrl);

      try {
        const response = await opts.fetch(callbackUrl, {
          method: "POST",
          body: JSON.stringify({
            status: "uploaded",
            metadata: JSON.parse(file.metadata ?? "{}") as FileData["metadata"],
            file: {
              url: `https://utfs.io/f/${encodeURIComponent(opts.fileKey)}`,
              key: opts.fileKey,
              name: file.fileName,
              size: file.fileSize,
              customId: file.customId,
            },
          }),
          headers: {
            "uploadthing-hook": "callback",
          },
        });
        if (isValidResponse(response)) {
          logger.success(
            "Successfully simulated callback for file",
            opts.fileKey,
          );
        } else {
          throw new Error("Invalid response");
        }
      } catch (e) {
        logger.error(
          `Failed to simulate callback for file '${file.fileKey}'. Is your webhook configured correctly?`,
        );
        logger.error(
          `  - Make sure the URL '${callbackUrl}' is accessible without any authentication. You can verify this by running 'curl -X POST ${callbackUrl}' in your terminal`,
        );
        logger.error(
          `  - Still facing issues? Read https://docs.uploadthing.com/faq for common issues`,
        );
      }
      return file;
    },
  );

  if (fileData !== undefined) return fileData;

  logger.error(`Failed to simulate callback for file ${opts.fileKey}`);
  throw new UploadThingError({
    code: "UPLOAD_FAILED",
    message: "File took too long to upload",
  });
};
