/* eslint-disable @typescript-eslint/no-unsafe-argument */
/* eslint-disable @typescript-eslint/no-unsafe-member-access */
/* eslint-disable @typescript-eslint/no-unsafe-assignment */
import { UploadThingError } from "@uploadthing/shared";

import { maybeParseResponseXML } from "./internal/s3-error-parser";
import type {
  ActionType,
  FileRouter,
  inferEndpointInput,
  inferEndpointOutput,
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

type UploadFilesOptions<
  TRouter extends FileRouter,
  TEndpoint extends keyof TRouter,
> = {
  onUploadProgress?: ({
    file,
    progress,
  }: {
    file: string;
    progress: number;
  }) => void;
  onUploadBegin?: ({ file }: { file: string }) => void;

  files: File[];
} & (undefined extends inferEndpointInput<TRouter[TEndpoint]>
  ? // eslint-disable-next-line @typescript-eslint/ban-types
    {}
  : {
      input: inferEndpointInput<TRouter[TEndpoint]>;
    });

export type UploadFileResponse<TServerOutput> = {
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

  // Matches what's returned from the serverside `onUploadComplete` callback
  serverdata: TServerOutput;
};

export const DANGEROUS__uploadFiles = async <
  TRouter extends FileRouter,
  TEndpoint extends keyof TRouter,
>(
  endpoint: TEndpoint,
  opts: UploadFilesOptions<TRouter, TEndpoint>,
  config?: {
    url?: string;
  },
) => {
  // Get presigned URL for S3 upload
  const s3ConnectionRes = await fetch(
    createAPIRequestUrl({
      url: config?.url,
      slug: String(endpoint),
      actionType: "upload",
    }),
    {
      method: "POST",
      body: JSON.stringify({
        files: opts.files.map((f) => f.name),
        input: "input" in opts ? opts.input : null,
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
        opts.onUploadProgress?.({
          file: file.name,
          progress: (progressEvent.loaded / progressEvent.total) * 100,
        }),
      () => {
        opts.onUploadBegin?.({
          file: file.name,
        });
      },
    );

    if (upload.status > 299 || upload.status < 200) {
      // tell uploadthing infra server that upload failed
      await fetch(
        createAPIRequestUrl({
          url: config?.url,
          slug: String(endpoint),
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
    const genUrl = "https://utfs.io/f/" + encodeURIComponent(fields.key);

    const serverdata = await fetch("/api/uploadthing", {
      headers: { "x-uploadthing-polling-key": fields.key },
    }).then((res) => res.json());

    // TODO: remove `file` prefix in next major version
    const ret: UploadFileResponse<inferEndpointOutput<TRouter[TEndpoint]>> = {
      fileName: file.name,
      name: file.name,
      fileSize: file.size,
      size: file.size,
      fileKey: presigned.key,
      key: presigned.key,
      fileUrl: genUrl,
      url: genUrl,

      serverdata,
    };

    return ret;
  });

  return Promise.all(fileUploadPromises);
};

export const genUploader = <TRouter extends FileRouter>() => {
  return <TEndpoint extends keyof TRouter>(
    ...args: Parameters<typeof DANGEROUS__uploadFiles<TRouter, TEndpoint>>
  ) => DANGEROUS__uploadFiles<TRouter, TEndpoint>(...args);
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
