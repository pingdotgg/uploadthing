import { generateUploadThingURL, UploadThingError } from "@uploadthing/shared";
import type { ContentDisposition, FetchEsque } from "@uploadthing/shared";

import { maybeParseResponseXML } from "./s3-error-parser";

/**
 * Used by server uploads where progress is not needed.
 * Uses normal fetch API.
 */
export async function uploadPart(
  opts: {
    fetch: FetchEsque;
    url: string;
    key: string;
    chunk: Blob;
    contentType: string;
    contentDisposition: ContentDisposition;
    fileName: string;
    maxRetries: number;
    utRequestHeaders: Record<string, string>;
  },
  retryCount = 0,
) {
  const s3Res = await opts.fetch(opts.url, {
    method: "PUT",
    body: opts.chunk,
    headers: {
      "Content-Type": opts.contentType,
      "Content-Disposition": [
        opts.contentDisposition,
        `filename="${opts.fileName}"`,
        `filename*=UTF-8''${opts.fileName}`,
      ].join("; "),
    },
  });

  if (s3Res.ok) {
    const etag = s3Res.headers.get("Etag");
    if (!etag) {
      throw new UploadThingError({
        code: "UPLOAD_FAILED",
        message: "Missing Etag header from uploaded part",
      });
    }
    return etag.replace(/"/g, "");
  }

  if (retryCount < opts.maxRetries) {
    // Retry after exponential backoff
    const delay = 2 ** retryCount * 1000;
    await new Promise((r) => setTimeout(r, delay));
    return uploadPart(opts, retryCount++);
  }

  // Max retries exceeded, tell UT server that upload failed
  await opts.fetch(generateUploadThingURL("/api/failureCallback"), {
    method: "POST",
    body: JSON.stringify({
      fileKey: opts.key,
    }),
    headers: opts.utRequestHeaders,
  });

  const text = await s3Res.text();
  const parsed = maybeParseResponseXML(text);
  if (parsed?.message) {
    throw new UploadThingError({
      code: "UPLOAD_FAILED",
      message: parsed.message,
    });
  }
  throw new UploadThingError({
    code: "UPLOAD_FAILED",
    message: "Failed to upload file to storage provider",
    cause: s3Res,
  });
}

/**
 * Used by client uploads where progress is needed.
 * Uses XMLHttpRequest.
 */
export async function uploadPartWithProgress(
  opts: {
    url: string;
    chunk: Blob;
    fileType: string;
    fileName: string;
    contentDisposition: ContentDisposition;
    maxRetries: number;
    onProgress: (progressDelta: number) => void;
  },
  retryCount = 0,
) {
  return new Promise<string>((resolve, reject) => {
    const xhr = new XMLHttpRequest();

    xhr.open("PUT", opts.url, true);
    xhr.setRequestHeader("Content-Type", opts.fileType);
    xhr.setRequestHeader(
      "Content-Disposition",
      [
        opts.contentDisposition,
        `filename="${opts.fileName}"`,
        `filename*=UTF-8''${opts.fileName}`,
      ].join("; "),
    );

    xhr.onload = async () => {
      if (xhr.status >= 200 && xhr.status < 300) {
        const etag = xhr.getResponseHeader("Etag");
        etag ? resolve(etag) : reject("NO ETAG");
      } else if (retryCount < opts.maxRetries) {
        // Add a delay before retrying (exponential backoff can be used)
        const delay = Math.pow(2, retryCount) * 1000;
        await new Promise((res) => setTimeout(res, delay));
        await uploadPartWithProgress(opts, retryCount + 1); // Retry the request
      } else {
        reject("Max retries exceeded");
      }
    };

    let lastProgress = 0;

    xhr.onerror = async () => {
      lastProgress = 0;
      if (retryCount < opts.maxRetries) {
        // Add a delay before retrying (exponential backoff can be used)
        const delay = Math.pow(2, retryCount) * 100;
        await new Promise((res) => setTimeout(res, delay));
        await uploadPartWithProgress(opts, retryCount + 1); // Retry the request
      } else {
        reject("Max retries exceeded");
      }
    };

    xhr.upload.onprogress = (e) => {
      const delta = e.loaded - lastProgress;
      lastProgress += delta;
      opts.onProgress(delta);
    };

    xhr.send(opts.chunk);
  });
}
