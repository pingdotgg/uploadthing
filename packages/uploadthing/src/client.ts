/* eslint-disable @typescript-eslint/no-unsafe-argument */
/* eslint-disable @typescript-eslint/no-unsafe-member-access */
/* eslint-disable @typescript-eslint/no-unsafe-assignment */
import { pollForFileData, UploadThingError } from "@uploadthing/shared";

import type { FileRouter, inferEndpointInput } from "./internal/types";

function fetchWithProgress(
  url: string,
  opts: {
    headers?: Headers;
    method?: string;
    body?: string | FormData;
  } = {},
  onProgress?: (this: XMLHttpRequest, progress: ProgressEvent) => void,
) {
  return new Promise<XMLHttpRequest>((res, rej) => {
    const xhr = new XMLHttpRequest();
    xhr.open(opts.method || "get", url);
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
    xhr.send(opts.body);
  });
}

const createRequestPermsUrl = (config: { url?: string; slug: string }) => {
  const queryParams = `?actionType=upload&slug=${config.slug}`;

  return `${config?.url ?? "/api/uploadthing"}${queryParams}`;
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
    input?: inferEndpointInput<TRouter[TEndpoint]>;

    files: File[];
  };
}[keyof TRouter];

export const DANGEROUS__uploadFiles = async <TRouter extends FileRouter>(
  opts: UploadFilesOptions<TRouter>,
  config?: {
    url?: string;
  },
) => {
  // Get presigned URL for S3 upload
  const s3ConnectionRes = await fetch(
    createRequestPermsUrl({
      url: config?.url,
      slug: String(opts.endpoint),
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
        message: `Failed to parse response as JSON. Got: ${res.body}`,
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
        code: "BAD_REQUEST",
        message: "No file found for presigned URL",
        cause: presigned,
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
    );

    if (upload.status > 299 || upload.status < 200) {
      throw new UploadThingError({
        code: "FAILED_TO_UPLOAD",
        message: `Failed to upload file ${file.name} to S3`,
        cause: upload,
      });
    }

    // Generate a URL for the uploaded image since AWS won't give me one
    const genUrl =
      "https://uploadthing.com/f/" + encodeURIComponent(fields["key"]);

    // Poll for file data, this way we know that the client-side onUploadComplete callback will be called after the server-side version
    await pollForFileData(presigned.key);

    return {
      fileKey: presigned.key,
      fileUrl: genUrl,
    };
  });

  return Promise.all(fileUploadPromises) as Promise<
    { fileUrl: string; fileKey: string }[]
  >;
};

export type UploadFileType<TRouter extends FileRouter> =
  typeof DANGEROUS__uploadFiles<TRouter>;

export const genUploader = <
  TRouter extends FileRouter,
>(): typeof DANGEROUS__uploadFiles<TRouter> => {
  return DANGEROUS__uploadFiles;
};

export const classNames = (...classes: Array<string | boolean>) => {
  return classes.filter(Boolean).join(" ");
};

export const generateMimeTypes = (fileTypes: string[]) => {
  const accepted = fileTypes.map((type) => {
    if (type === "blob") return "blob";
    if (type === "pdf") return "application/pdf";
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
