// Don't want to ship our logger to the client, keep size down
/* eslint-disable no-console */

import {
  resolveMaybeUrlArg,
  safeParseJSON,
  UploadThingError,
  withExponentialBackoff,
} from "@uploadthing/shared";

import * as pkgJson from "../package.json";
import { UPLOADTHING_VERSION } from "./internal/constants";
import { uploadPartWithProgress } from "./internal/multi-part";
import type { FileRouter, inferEndpointOutput } from "./internal/types";
import type { UTReporter } from "./internal/ut-reporter";
import { createAPIRequestUrl, createUTReporter } from "./internal/ut-reporter";
import type {
  GenerateUploaderOptions,
  MPUResponse,
  PSPResponse,
  UploadedFile,
  UploadFilesOptions,
  UploadThingResponse,
} from "./types";

export {
  /** @public */
  generateMimeTypes,
  /** @public */
  generateClientDropzoneAccept,
} from "@uploadthing/shared";

export const version = pkgJson.version;

const uploadFilesInternal = async <
  TRouter extends FileRouter,
  TEndpoint extends keyof TRouter,
  TSkipPolling extends boolean = false,
  TServerOutput = false extends TSkipPolling
    ? inferEndpointOutput<TRouter[TEndpoint]>
    : null,
>(
  endpoint: TEndpoint,
  opts: UploadFilesOptions<TRouter, TEndpoint, TSkipPolling>,
): Promise<UploadedFile<TServerOutput>[]> => {
  // Fine to use global fetch in browser
  const fetch = globalThis.fetch.bind(globalThis);

  const reportEventToUT = createUTReporter({
    endpoint: String(endpoint),
    url: opts.url,
    package: opts.package,
    fetch,
  });

  // Get presigned URL for S3 upload
  const s3ConnectionRes = await fetch(
    createAPIRequestUrl({
      url: opts.url,
      slug: String(endpoint),
      actionType: "upload",
    }),
    {
      method: "POST",
      body: JSON.stringify({
        input: "input" in opts ? opts.input : null,
        files: opts.files.map((f) => ({ name: f.name, size: f.size })),
      }),
      // Express requires Content-Type to be explicitly set to parse body properly
      headers: {
        "Content-Type": "application/json",
        "x-uploadthing-package": opts.package,
        "x-uploadthing-version": UPLOADTHING_VERSION,
      },
    },
  ).then(async (res) => {
    // check for 200 response
    if (!res.ok) {
      const error = await UploadThingError.fromResponse(res);
      throw error;
    }

    const jsonOrError = await safeParseJSON<UploadThingResponse>(res);
    if (jsonOrError instanceof Error) {
      throw new UploadThingError({
        code: "BAD_REQUEST",
        message: jsonOrError.message,
        cause: res,
      });
    }
    return jsonOrError;
  });

  if (!s3ConnectionRes || !Array.isArray(s3ConnectionRes)) {
    throw new UploadThingError({
      code: "BAD_REQUEST",
      message: "No URL. How did you even get here?",
      cause: s3ConnectionRes,
    });
  }

  const fileUploadPromises = s3ConnectionRes.map(async (presigned) => {
    const file = opts.files.find((f) => f.name === presigned.fileName);

    if (!file) {
      console.error("No file found for presigned URL", presigned);
      throw new UploadThingError({
        code: "NOT_FOUND",
        message: "No file found for presigned URL",
        cause: `Expected file with name ${
          presigned.fileName
        } but got '${opts.files.join(",")}'`,
      });
    }

    opts.onUploadBegin?.({ file: file.name });
    if ("urls" in presigned) {
      await uploadMultipart(file, presigned, { reportEventToUT, ...opts });
      // wait a bit as it's unsreasonable to expect the server to be done by now
      await new Promise((r) => setTimeout(r, 750));
    } else {
      await uploadPresignedPost(file, presigned, { reportEventToUT, ...opts });
    }

    let serverData: inferEndpointOutput<TRouter[TEndpoint]> | null = null;
    if (!opts.skipPolling) {
      serverData = await withExponentialBackoff(async () => {
        type PollingResponse =
          | {
              status: "done";
              callbackData: inferEndpointOutput<TRouter[TEndpoint]>;
            }
          | { status: "still waiting" };

        const res = await fetch(presigned.pollingUrl, {
          headers: { authorization: presigned.pollingJwt },
        }).then((r) => r.json() as Promise<PollingResponse>);

        // eslint-disable-next-line @typescript-eslint/no-unsafe-return
        return res.status === "done" ? res.callbackData : undefined;
      });
    }

    return {
      name: file.name,
      size: file.size,
      key: presigned.key,

      serverData,
      url: "https://utfs.io/f/" + presigned.key,
    };
  });

  // eslint-disable-next-line @typescript-eslint/no-unsafe-return
  return Promise.all(fileUploadPromises) as any;
};

export const genUploader = <TRouter extends FileRouter>(
  initOpts: GenerateUploaderOptions,
) => {
  return <
    TEndpoint extends keyof TRouter,
    TSkipPolling extends boolean = false,
  >(
    endpoint: TEndpoint,
    opts: Omit<
      UploadFilesOptions<TRouter, TEndpoint, TSkipPolling>,
      keyof GenerateUploaderOptions
    >,
  ) =>
    // eslint-disable-next-line @typescript-eslint/no-unsafe-argument
    uploadFilesInternal<TRouter, TEndpoint, TSkipPolling>(endpoint, {
      ...opts,
      url: resolveMaybeUrlArg(initOpts?.url),
      package: initOpts.package,
    } as any);
};

async function uploadMultipart(
  file: File,
  presigned: MPUResponse,
  opts: {
    reportEventToUT: UTReporter;
    onUploadProgress?: UploadFilesOptions<any, any>["onUploadProgress"];
  },
) {
  let etags: { tag: string; partNumber: number }[];
  let uploadedBytes = 0;

  try {
    etags = await Promise.all(
      presigned.urls.map(async (url, index) => {
        const offset = presigned.chunkSize * index;
        const end = Math.min(offset + presigned.chunkSize, file.size);
        const chunk = file.slice(offset, end);

        const etag = await uploadPartWithProgress({
          url,
          chunk: chunk,
          contentDisposition: presigned.contentDisposition,
          fileType: file.type,
          fileName: file.name,
          maxRetries: 10,
          onProgress: (delta) => {
            uploadedBytes += delta;
            const percent = (uploadedBytes / file.size) * 100;
            opts.onUploadProgress?.({ file: file.name, progress: percent });
          },
        });

        return { tag: etag, partNumber: index + 1 };
      }),
    );
  } catch (error) {
    await opts.reportEventToUT("failure", {
      fileKey: presigned.key,
      uploadId: presigned.uploadId,
      fileName: file.name,
      s3Error: (error as Error).toString(),
    });
    throw "unreachable"; // failure event will throw for us
  }

  // Tell the server that the upload is complete
  const uploadOk = await opts.reportEventToUT("multipart-complete", {
    uploadId: presigned.uploadId,
    fileKey: presigned.key,
    etags,
  });
  if (!uploadOk) {
    console.log("Failed to alert UT of upload completion");
    throw new UploadThingError({
      code: "UPLOAD_FAILED",
      message: "Failed to alert UT of upload completion",
    });
  }
}

async function uploadPresignedPost(
  file: File,
  presigned: PSPResponse,
  opts: {
    reportEventToUT: UTReporter;
    onUploadProgress?: UploadFilesOptions<any, any>["onUploadProgress"];
  },
) {
  const formData = new FormData();
  Object.entries(presigned.fields).forEach(([k, v]) => formData.append(k, v));
  formData.append("file", file); // File data **MUST GO LAST**

  const response = await new Promise<XMLHttpRequest>((resolve, reject) => {
    const xhr = new XMLHttpRequest();
    xhr.open("POST", presigned.url);
    xhr.setRequestHeader("Accept", "application/xml");
    xhr.upload.onprogress = (p) => {
      opts.onUploadProgress?.({
        file: file.name,
        progress: (p.loaded / p.total) * 100,
      });
    };
    xhr.onload = (e) => resolve(e.target as XMLHttpRequest);
    xhr.onerror = (e) => reject(e);
    xhr.send(formData);
  }).catch(async (error) => {
    await opts.reportEventToUT("failure", {
      fileKey: presigned.key,
      uploadId: null,
      fileName: file.name,
      s3Error: (error as Error).toString(),
    });
    throw "unreachable"; // failure event will throw for us
  });

  if (response.status > 299 || response.status < 200) {
    await opts.reportEventToUT("failure", {
      fileKey: presigned.key,
      uploadId: null,
      fileName: file.name,
    });
  }
}
