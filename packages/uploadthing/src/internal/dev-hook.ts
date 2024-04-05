import {
  generateUploadThingURL,
  pollForFileData,
  signPayload,
  UploadThingError,
} from "@uploadthing/shared";
import type { FetchEsque, ResponseEsque } from "@uploadthing/shared";

import type { UploadedFileData } from "../types";
import { UPLOADTHING_VERSION } from "./constants";
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
    async (json: {
      fileData: {
        callbackUrl: string;
        callbackSlug: string;
        metadata: string | null;
        fileName: string;
        fileSize: number;
        fileType: string;
        customId: string | null;
      };
    }) => {
      const file = json.fileData;

      let callbackUrl = file.callbackUrl + `?slug=${file.callbackSlug}`;
      if (!callbackUrl.startsWith("http"))
        callbackUrl = "http://" + callbackUrl;

      logger.info("SIMULATING FILE UPLOAD WEBHOOK CALLBACK", callbackUrl);

      const payload = JSON.stringify({
        status: "uploaded",
        metadata: JSON.parse(file.metadata ?? "{}") as unknown,
        file: {
          url: `https://utfs.io/f/${encodeURIComponent(opts.fileKey)}`,
          key: opts.fileKey,
          name: file.fileName,
          size: file.fileSize,
          type: file.fileType,
          customId: file.customId,
        } satisfies UploadedFileData,
      });

      const signature = await signPayload(payload, opts.apiKey);

      try {
        const response = await opts.fetch(callbackUrl, {
          method: "POST",
          body: payload,
          headers: {
            "uploadthing-hook": "callback",
            "x-uploadthing-signature": signature,
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
          `Failed to simulate callback for file '${opts.fileKey}'. Is your webhook configured correctly?`,
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
