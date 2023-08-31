/* eslint-disable @typescript-eslint/no-unsafe-argument */
/* eslint-disable @typescript-eslint/no-unsafe-member-access */
/* eslint-disable @typescript-eslint/no-unsafe-assignment */
import type { FileData } from "@uploadthing/shared";
import { pollForFileData, UploadThingError } from "@uploadthing/shared";

import { maybeParseResponseXML } from "./internal/s3-error-parser";
import type {
  ActionType,
  FileRouter,
  inferEndpointInput,
} from "./internal/types";

function fetchWithProgress(
  url: string,
  opts: {
    headers?: Headers;
    method?: string;
    body?: string | FormData;
  } = {},
  onProgress?: (this: XMLHttpRequest, progress: ProgressEvent) => void,
  onUploadBegin?: (this: XMLHttpRequest, progress: ProgressEvent) => void,
) {
  return new Promise<XMLHttpRequest>((res, rej) => {
    const xhr = new XMLHttpRequest();
    xhr.open(opts.method ?? "get", url);
    opts.headers &&
      Object.keys(opts.headers).forEach(
        (h) =>
          opts.headers && xhr.setRequestHeader(h, opts.headers.get(h) ?? ""),
      );
    xhr.onload = (e) => {
      res(e.target as XMLHttpRequest);
    };

    xhr.onerror = rej;
    if (xhr.upload && onProgress) xhr.upload.onprogress = onProgress;
    if (xhr.upload && onUploadBegin) xhr.upload.onloadstart = onUploadBegin;
    xhr.send(opts.body);
  });
}

const createAPIRequestUrl = (config: {
  url?: string;
  slug: string;
  actionType: ActionType;
}) => {
  const url = new URL(
    config.url ?? `${window.location.origin}/api/uploadthing`,
  );

  const queryParams = new URLSearchParams(url.search);
  queryParams.set("actionType", config.actionType);
  queryParams.set("slug", config.slug);

  url.search = queryParams.toString();
  return url.toString();
};

type UploadFilesOptions<TRouter extends FileRouter> = {
  [TEndpoint in keyof TRouter]: {
    endpoint: TEndpoint;
    onUploadProgress?: ({
      file,
      progress,
    }: {
      file: string;
      progress: number;
    }) => void;
    onUploadBegin?: ({ file }: { file: string }) => void;
    input?: inferEndpointInput<TRouter[TEndpoint]>;

    files: File[];
  };
}[keyof TRouter];

export type UploadFileResponse = {
  /**
   * @deprecated
   * use `name` instead
   */
  fileName: string;
  name: string;
  /**
   * @deprecated
   * use `size` instead
   */
  fileSize: number;
  size: number;
  /**
   * @deprecated
   * use `key` instead
   */
  fileKey: string;
  key: string;
  /**
   * @deprecated
   * use `url` instead
   */
  fileUrl: string;
  url: string;
};

export const DANGEROUS__uploadFiles = async <TRouter extends FileRouter>(
  opts: UploadFilesOptions<TRouter>,
  config?: {
    url?: string;
  },
) => {
  // Get presigned URL for S3 upload
  const s3ConnectionRes = await fetch(
    createAPIRequestUrl({
      url: config?.url,
      slug: String(opts.endpoint),
      actionType: "upload",
    }),
    {
      method: "POST",
      body: JSON.stringify({
        files: opts.files.map((f) => f.name),
        input: opts.input,
      }),
    },
  ).then(async (res) => {
    // check for 200 response
    if (!res.ok) {
      const error = await UploadThingError.fromResponse(res);
      throw error;
    }

    // attempt to parse response
    try {
      return res.json();
    } catch (e) {
      // response is not JSON
      console.error(e);
      throw new UploadThingError({
        code: "BAD_REQUEST",
        message: `Failed to parse response as JSON. Got: ${await res.text()}`,
        cause: e,
      });
    }
  });

  if (!s3ConnectionRes || !Array.isArray(s3ConnectionRes)) {
    throw new UploadThingError({
      code: "BAD_REQUEST",
      message: "No URL. How did you even get here?",
      cause: s3ConnectionRes,
    });
  }

  const fileUploadPromises = s3ConnectionRes.map(async (presigned: any) => {
    const file = opts.files.find((f) => f.name === presigned.name);

    if (!file) {
      console.error("No file found for presigned URL", presigned);
      throw new UploadThingError({
        code: "NOT_FOUND",
        message: "No file found for presigned URL",
        cause: `Expected file with name ${
          presigned.name
        } but got '${opts.files.join(",")}'`,
      });
    }
    const { url, fields } = presigned.presignedUrl;
    const formData = new FormData();

    // Give content type to blobs because S3 is dumb
    // check if content-type is one of the allowed types, or if not and blobs are allowed, use application/octet-stream
    if (
      presigned.fileType === file.type.split("/")[0] ||
      presigned.fileType === file.type
    ) {
      formData.append("Content-Type", file.type);
    } else if (presigned.fileType === "blob") {
      formData.append("Content-Type", "application/octet-stream");
    } else if (presigned.fileType === "pdf") {
      formData.append("Content-Type", "application/pdf");
    }

    // Dump all values from response (+ the file itself) into form for S3 upload
    Object.entries({ ...fields, file: file }).forEach(([key, value]) => {
      formData.append(key, value as Blob);
    });

    // Do S3 upload
    const upload = await fetchWithProgress(
      url,
      {
        method: "POST",
        body: formData,
        headers: new Headers({
          Accept: "application/xml",
        }),
      },
      (progressEvent) =>
        opts.onUploadProgress &&
        opts.onUploadProgress({
          file: file.name,
          progress: (progressEvent.loaded / progressEvent.total) * 100,
        }),
      () => {
        opts.onUploadBegin &&
          opts.onUploadBegin({
            file: file.name,
          });
      },
    );

    if (upload.status > 299 || upload.status < 200) {
      // tell uploadthing infra server that upload failed
      await fetch(
        createAPIRequestUrl({
          url: config?.url,
          slug: String(opts.endpoint),
          actionType: "failure",
        }),
        {
          method: "POST",
          body: JSON.stringify({
            fileKey: fields.key,
          }),
        },
      );

      // Attempt to parse response as XML
      const parsed = maybeParseResponseXML(upload.responseText);

      // Throw an error for the client
      if (parsed?.message) {
        throw new UploadThingError({
          code: parsed.code,
          message: parsed.message,
        });
      } else {
        throw new UploadThingError({
          code: "UPLOAD_FAILED",
          message: `Failed to upload file ${file.name} to S3`,
          cause: upload.responseText,
        });
      }
    }

    // Generate a URL for the uploaded image since AWS won't give me one
    const genUrl =
      "https://uploadthing.com/f/" + encodeURIComponent(fields.key);

    // Poll for file data, this way we know that the client-side onUploadComplete callback will be called after the server-side version
    const fileData = await pollForFileData(presigned.key);

    // TODO: remove `file` prefix in next major version
    const ret: UploadFileResponse = {
      fileName: file.name,
      name: file.name,
      fileSize: file.size,
      size: file.size,
      fileKey: presigned.key,
      key: presigned.key,
      fileUrl: genUrl,
      url: genUrl,
    };

    console.log("fileData", fileData);

    if (!fileData) {
      console.log("[UT] Could not receive file data from UT");
    } else {
      console.log("[UT] Trying to simulate the webhook");

      await conditionalDevServer(fileData.fileData, presigned.key);
    }

    return ret;
  });

  return Promise.all(fileUploadPromises);
};

const conditionalDevServer = async (file: FileData, fileKey: string) => {
  if (process.env.NODE_ENV !== "development") return;

  let callbackUrl = file.callbackUrl + `?slug=${file.callbackSlug}`;
  if (!callbackUrl.startsWith("http")) callbackUrl = "http://" + callbackUrl;

  console.log("[UT] SIMULATING FILE UPLOAD WEBHOOK CALLBACK", callbackUrl);

  const response = await fetch(callbackUrl, {
    method: "POST",
    body: JSON.stringify({
      status: "uploaded",
      metadata: JSON.parse(file.metadata ?? "{}") as FileData["metadata"],
      file: {
        url: `https://uploadthing.com/f/${encodeURIComponent(fileKey)}`,
        key: fileKey,
        name: file.fileName,
        size: file.fileSize,
      },
    }),
    headers: {
      "uploadthing-hook": "callback",
    },
  });

  if (isValidResponse(response)) {
    console.log("[UT] Successfully simulated callback for file", fileKey);
  } else {
    console.error(
      "[UT] Failed to simulate callback for file. Is your webhook configured correctly?",
      fileKey,
    );
  }

  return file;
};

const isValidResponse = (response: Response) => {
  if (!response.ok) return false;
  if (response.status >= 400) return false;
  if (!response.headers.has("x-uploadthing-version")) return false;

  return true;
};

export const genUploader = <
  TRouter extends FileRouter,
>(): typeof DANGEROUS__uploadFiles<TRouter> => {
  return DANGEROUS__uploadFiles;
};

export const classNames = (...classes: (string | boolean)[]) => {
  return classes.filter(Boolean).join(" ");
};

export const generateMimeTypes = (fileTypes: string[]) => {
  const accepted = fileTypes.map((type) => {
    if (type === "blob") return "blob";
    if (type === "pdf") return "application/pdf";
    if (type.includes("/")) return type;
    else return `${type}/*`;
  });

  if (accepted.includes("blob")) {
    return undefined;
  }
  return accepted;
};

export const generateClientDropzoneAccept = (fileTypes: string[]) => {
  const mimeTypes = generateMimeTypes(fileTypes);

  if (!mimeTypes) return undefined;

  return Object.fromEntries(mimeTypes.map((type) => [type, []]));
};
