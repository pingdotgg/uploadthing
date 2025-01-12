/* eslint-disable no-restricted-globals */
import { ParseResult } from "effect";
import { http, HttpResponse } from "msw";
import { setupServer } from "msw/node";
import { afterAll, beforeAll, describe, expect, it } from "vitest";

import { createClient, UTFile } from "../src/sdk";
import { GetSignedURLCommand } from "../src/sdk/commands/get-signed-url";
import { UpdateACLCommand } from "../src/sdk/commands/update-acl";
import { UploadFileCommand } from "../src/sdk/commands/upload-file";
import {
  API_URL,
  callRequestSpy,
  handlers,
  INGEST_URL,
  requestSpy,
  testToken,
  UFS_HOST,
} from "./__test-helpers";

const msw = setupServer(...handlers);
beforeAll(() => msw.listen());
afterAll(() => msw.close());

describe("uploadFiles", () => {
  const fooFile = new File(["foo"], "foo.txt", { type: "text/plain" });

  it("uploads successfully", async () => {
    const client = createClient({ token: testToken.encoded });
    const result = await client.execute(UploadFileCommand({ body: fooFile }));

    expect(requestSpy).toHaveBeenCalledTimes(1);
    expect(requestSpy).toHaveBeenCalledWith(
      expect.stringContaining(INGEST_URL),
      expect.objectContaining({
        method: "PUT",
        body: expect.any(FormData),
        headers: expect.objectContaining({
          range: "bytes=0-",
        }),
      }),
    );

    const key = result.data?.key;
    expect(result).toEqual({
      data: {
        key: expect.stringMatching(/.+/),
        name: "foo.txt",
        size: 3,
        lastModified: fooFile.lastModified,
        url: `https://${testToken.decoded.appId}.${UFS_HOST}/f/${key}`,
        appUrl: `https://${testToken.decoded.appId}.${UFS_HOST}/f/${key}`,
        customId: null,
        type: "text/plain",
        fileHash: expect.any(String),
      },
      error: null,
    });
  });

  // it("returns array if array is passed", async () => {
  //   const client = createClient({ token: testToken.encoded });
  //   const result = await client.execute(
  //     UploadFileCommand({ body: [fooFile] }),
  //   );
  //   expectTypeOf<UploadFileResult[]>(result);
  //   expect(Array.isArray(result)).toBe(true);
  // });

  it("accepts UTFile", async () => {
    const client = createClient({ token: testToken.encoded });
    const file = new UTFile(["foo"], "foo.txt");
    await client.execute(UploadFileCommand({ body: file }));
    expect(file.type).toBe("text/plain");

    expect(requestSpy).toHaveBeenCalledWith(
      expect.stringContaining(`x-ut-file-name=foo.txt`),
      expect.objectContaining({ method: "PUT" }),
    );
  });

  it("accepts UTFile with customId", async () => {
    const client = createClient({ token: testToken.encoded });
    const fileWithId = new UTFile(["foo"], "foo.txt", { customId: "foo" });
    await client.execute(UploadFileCommand({ body: fileWithId }));
    expect(fileWithId.customId).toBe("foo");

    expect(requestSpy).toHaveBeenCalledWith(
      expect.stringContaining(`x-ut-custom-id=foo`),
      expect.objectContaining({ method: "PUT" }),
    );
  });

  it("gracefully handles failed requests", async () => {
    const mockedIngestUrl = "https://mocked.ingest.uploadthing.com";
    msw.use(
      http.all<{ key: string }>(
        `${mockedIngestUrl}/:key`,
        async ({ request }) => {
          await callRequestSpy(request);
          return HttpResponse.json({ error: "Upload failed" }, { status: 400 });
        },
      ),
    );

    const client = createClient({
      token: testToken.encoded,
      /**
       * Explicitly set the ingestUrl to the mocked one
       * to ensure the request is made to the mocked ingest
       * endpoint that yields a 400 error.
       */
      ingestUrl: mockedIngestUrl,
    });
    const result = await client.execute(UploadFileCommand({ body: fooFile }));
    expect(result).toStrictEqual({
      data: null,
      error: {
        code: "UPLOAD_FAILED",
        data: undefined,
        message: "Failed to upload file",
      },
    });

    expect(requestSpy).toHaveBeenCalledTimes(1);
    expect(requestSpy).toHaveBeenCalledWith(
      expect.stringContaining(mockedIngestUrl),
      expect.objectContaining({ method: "PUT" }),
    );

    msw.use(...handlers);
  });
});

describe("uploadFilesFromUrl", () => {
  it("downloads, then uploads successfully", async () => {
    const client = createClient({ token: testToken.encoded });
    const result = await client.execute(
      UploadFileCommand({
        body: await fetch("https://cdn.foo.com/foo.txt"),
        name: "foo.txt",
      }),
    );

    expect(requestSpy).toHaveBeenCalledTimes(2); // download, upload
    expect(requestSpy).toHaveBeenNthCalledWith(
      2,
      expect.stringContaining(`x-ut-file-name=foo.txt`),
      {
        method: "PUT",
        body: expect.any(FormData),
        headers: expect.objectContaining({
          range: "bytes=0-",
        }),
      },
    );

    const key = result.data?.key;
    expect(result).toEqual({
      data: {
        key: expect.stringMatching(/.+/),
        name: "foo.txt",
        size: 26,
        lastModified: expect.any(Number),
        url: `https://${testToken.decoded.appId}.${UFS_HOST}/f/${key}`,
        appUrl: `https://${testToken.decoded.appId}.${UFS_HOST}/f/${key}`,
        customId: null,
        type: "text/plain",
        fileHash: expect.any(String),
      },
      error: null,
    });
  });

  // it("returns array if array is passed", async () => {
  //   const client = createClient({ token: testToken.encoded });
  //   const result = await client.execute(
  //     UploadFileCommand({
  //       body: await fetch("https://cdn.foo.com/foo.txt"),
  //       name: "foo.txt",
  //     }),
  //   );
  //   expectTypeOf<UploadFileResult[]>(result);
  //   expect(Array.isArray(result)).toBe(true);
  // });

  // it("returns single object if no array is passed", async () => {
  //   const client = createClient({ token: testToken.encoded });
  //   const result = await client.execute(
  //     UploadFilesFromUrlCommand({
  //       urls: ["https://cdn.foo.com/foo.txt"],
  //     }),
  //   );
  //   expectTypeOf<UploadFileResult>(result);
  //   expect(Array.isArray(result)).toBe(false);
  // });

  it("can provide a customId", async () => {
    const client = createClient({ token: testToken.encoded });
    await client.execute(
      UploadFileCommand({
        body: await fetch("https://cdn.foo.com/foo.txt"),
        name: "foo.txt",
        customId: "my-custom-id",
      }),
    );

    expect(requestSpy).toHaveBeenCalledWith(
      expect.stringContaining(`x-ut-custom-id=my-custom-id`),
      {
        method: "PUT",
        body: expect.any(FormData),
        headers: expect.objectContaining({
          range: "bytes=0-",
        }),
      },
    );
  });

  // if passed data url, array contains UploadThingError
  // TODO: Maybe make this work
  // it("returns error if data url is passed", async () => {
  //   const client = createClient({ token: testToken.encoded });
  //   const result = await client.execute(
  //     UploadFileCommand({
  //       body: ""data:text/plain;base64,SGVsbG8sIFdvcmxkIQ=="",
  //       name: "foo.txt",
  //     }),
  //   );
  //   expect(result).toStrictEqual({
  //     data: null,
  //     error: {
  //       code: "BAD_REQUEST",
  //       data: undefined,
  //       message:
  //         "Please use uploadFiles() for data URLs. uploadFilesFromUrl() is intended for use with remote URLs only.",
  //     },
  //   });
  // });

  it("gracefully handles download errors", async () => {
    const client = createClient({ token: testToken.encoded });

    msw.use(
      http.get("https://cdn.foo.com/does-not-exist.txt", () => {
        return new HttpResponse("Not found", { status: 404 });
      }),
    );

    const result = await client.execute(
      UploadFileCommand({
        body: await fetch("https://cdn.foo.com/does-not-exist.txt"),
        name: "foo.txt",
      }),
    );
    expect(result).toEqual({
      data: null,
      error: {
        code: "BAD_REQUEST",
        data: expect.objectContaining({
          _tag: "ResponseError",
          description: "non 2xx status code",
        }),
        message:
          "Failed to download requested file: StatusCode: non 2xx status code (404 GET https://cdn.foo.com/does-not-exist.txt)",
      },
    });
  });

  // it("gracefully handles download errors", async () => {
  //   const client = createClient({ token: testToken.encoded });

  //   msw.use(
  //     http.get("https://cdn.foo.com/does-not-exist.txt", () => {
  //       return new HttpResponse("Not found", { status: 404 });
  //     }),
  //   );

  //   const result = await utapi.uploadFilesFromUrl([
  //     "https://cdn.foo.com/exists.txt",
  //     "https://cdn.foo.com/does-not-exist.txt",
  //   ]);
  //   const key1 = result[0]?.data?.key;
  //   expect(result).toEqual([
  //     {
  //       data: {
  //         customId: null,
  //         fileHash: expect.any(String),
  //         key: expect.stringMatching(/.+/),
  //         lastModified: expect.any(Number),
  //         name: "exists.txt",
  //         size: 26,
  //         type: "text/plain",
  //         url: `https://${testToken.decoded.appId}.${UFS_HOST}/f/${key1}`,
  //         appUrl: `https://${testToken.decoded.appId}.${UFS_HOST}/f/${key1}`,
  //       },
  //       error: null,
  //     },
  //     {
  //       data: null,
  //       error: {
  //         code: "BAD_REQUEST",
  //         data: expect.objectContaining({
  //           _tag: "ResponseError",
  //           description: "non 2xx status code",
  //         }),
  //         message:
  //           "Failed to download requested file: StatusCode: non 2xx status code (404 GET https://cdn.foo.com/does-not-exist.txt)",
  //       },
  //     },
  //   ]);
  // });

  // it("preserves order if some download fails", async () => {
  //   const utapi = new UTApi({ token: testToken.encoded });
  //   const result = await utapi.uploadFilesFromUrl([
  //     "https://cdn.foo.com/foo.txt",
  //     "data:text/plain;base64,SGVsbG8sIFdvcmxkIQ==",
  //     "https://cdn.foo.com/bar.txt",
  //   ]);
  //   const key1 = result[0]?.data?.key;
  //   const key2 = result[2]?.data?.key;
  //   expect(result).toStrictEqual([
  //     {
  //       data: {
  //         customId: null,
  //         key: expect.stringMatching(/.+/),
  //         lastModified: expect.any(Number),
  //         name: "foo.txt",
  //         size: 26,
  //         type: "text/plain",
  //         url: `https://${testToken.decoded.appId}.${UFS_HOST}/f/${key1}`,
  //         appUrl: `https://${testToken.decoded.appId}.${UFS_HOST}/f/${key1}`,
  //         fileHash: expect.any(String),
  //       },
  //       error: null,
  //     },
  //     {
  //       data: null,
  //       error: {
  //         code: "BAD_REQUEST",
  //         data: undefined,
  //         message:
  //           "Please use uploadFiles() for data URLs. uploadFilesFromUrl() is intended for use with remote URLs only.",
  //       },
  //     },
  //     {
  //       data: {
  //         customId: null,
  //         key: expect.stringMatching(/.+/),
  //         lastModified: expect.any(Number),
  //         name: "bar.txt",
  //         size: 26,
  //         type: "text/plain",
  //         url: `https://${testToken.decoded.appId}.${UFS_HOST}/f/${key2}`,
  //         appUrl: `https://${testToken.decoded.appId}.${UFS_HOST}/f/${key2}`,
  //         fileHash: expect.any(String),
  //       },
  //       error: null,
  //     },
  //   ]);
  // });
});

describe("getSignedURL", () => {
  it("sends request without expiresIn", async () => {
    const client = createClient({ token: testToken.encoded });
    await client.execute(GetSignedURLCommand({ key: "foo" }));

    expect(requestSpy).toHaveBeenCalledOnce();
    expect(requestSpy).toHaveBeenCalledWith(`${API_URL}/v6/requestFileAccess`, {
      body: { fileKey: "foo" },
      headers: expect.objectContaining({
        "content-type": "application/json",
        "x-uploadthing-api-key": "sk_foo",
        "x-uploadthing-be-adapter": "server-sdk",
        "x-uploadthing-version": expect.stringMatching(/\d+\.\d+\.\d+/),
      }),
      method: "POST",
    });
  });

  it("sends request with valid expiresIn (1)", async () => {
    const client = createClient({ token: testToken.encoded });
    await client.execute(
      GetSignedURLCommand({
        key: "foo",
        expiresIn: "1d",
      }),
    );

    expect(requestSpy).toHaveBeenCalledOnce();
    expect(requestSpy).toHaveBeenCalledWith(`${API_URL}/v6/requestFileAccess`, {
      body: { fileKey: "foo", expiresIn: 86400 },
      headers: expect.objectContaining({
        "content-type": "application/json",
        "x-uploadthing-api-key": "sk_foo",
        "x-uploadthing-be-adapter": "server-sdk",
        "x-uploadthing-version": expect.stringMatching(/\d+\.\d+\.\d+/),
      }),
      method: "POST",
    });
  });

  it("sends request with valid expiresIn (2)", async () => {
    const client = createClient({ token: testToken.encoded });
    await client.execute(
      GetSignedURLCommand({
        key: "foo",
        expiresIn: "3 minutes",
      }),
    );

    expect(requestSpy).toHaveBeenCalledOnce();
    expect(requestSpy).toHaveBeenCalledWith(`${API_URL}/v6/requestFileAccess`, {
      body: { fileKey: "foo", expiresIn: 180 },
      headers: expect.objectContaining({
        "content-type": "application/json",
        "x-uploadthing-api-key": "sk_foo",
        "x-uploadthing-be-adapter": "server-sdk",
        "x-uploadthing-version": expect.stringMatching(/\d+\.\d+\.\d+/),
      }),
      method: "POST",
    });
  });

  it("throws if expiresIn is invalid", async () => {
    const client = createClient({ token: testToken.encoded });
    await expect(
      client.execute(
        GetSignedURLCommand({
          key: "foo",
          // @ts-expect-error - intentionally passing invalid expiresIn
          expiresIn: "something",
        }),
      ),
    ).resolves.toEqual({
      data: null,
      error: expect.any(ParseResult.ParseError),
    });
    expect(requestSpy).toHaveBeenCalledTimes(0);
  });
});

describe("updateACL", () => {
  it("single file", async () => {
    const client = createClient({ token: testToken.encoded });

    await expect(
      client.execute(
        UpdateACLCommand({
          keys: ["ut-key"],
          acl: "public-read",
        }),
      ),
    ).resolves.toEqual({ data: { success: true }, error: null });

    expect(requestSpy).toHaveBeenCalledWith(`${API_URL}/v6/updateACL`, {
      body: { updates: [{ fileKey: "ut-key", acl: "public-read" }] },
      headers: expect.objectContaining({
        "content-type": "application/json",
        "x-uploadthing-api-key": "sk_foo",
        "x-uploadthing-be-adapter": "server-sdk",
        "x-uploadthing-version": expect.stringMatching(/\d+\.\d+\.\d+/),
      }),
      method: "POST",
    });
  });

  it("many keys", async () => {
    const client = createClient({ token: testToken.encoded });

    await expect(
      client.execute(
        UpdateACLCommand({
          keys: ["ut-key1", "ut-key2"],
          acl: "public-read",
        }),
      ),
    ).resolves.toEqual({ data: { success: true }, error: null });

    expect(requestSpy).toHaveBeenCalledWith(`${API_URL}/v6/updateACL`, {
      body: {
        updates: [
          { fileKey: "ut-key1", acl: "public-read" },
          { fileKey: "ut-key2", acl: "public-read" },
        ],
      },
      headers: expect.objectContaining({
        "content-type": "application/json",
        "x-uploadthing-api-key": "sk_foo",
        "x-uploadthing-be-adapter": "server-sdk",
        "x-uploadthing-version": expect.stringMatching(/\d+\.\d+\.\d+/),
      }),
      method: "POST",
    });
  });

  it("many keys with keytype override", async () => {
    const client = createClient({ token: testToken.encoded });

    await expect(
      client.execute(
        UpdateACLCommand({
          keys: ["my-custom-id1", "my-custom-id2"],
          acl: "public-read",
          keyType: "customId",
        }),
      ),
    ).resolves.toEqual({ data: { success: true }, error: null });

    expect(requestSpy).toHaveBeenCalledWith(`${API_URL}/v6/updateACL`, {
      body: {
        updates: [
          { customId: "my-custom-id1", acl: "public-read" },
          { customId: "my-custom-id2", acl: "public-read" },
        ],
      },
      headers: expect.objectContaining({
        "content-type": "application/json",
        "x-uploadthing-api-key": "sk_foo",
        "x-uploadthing-be-adapter": "server-sdk",
        "x-uploadthing-version": expect.stringMatching(/\d+\.\d+\.\d+/),
      }),
      method: "POST",
    });
  });
});
