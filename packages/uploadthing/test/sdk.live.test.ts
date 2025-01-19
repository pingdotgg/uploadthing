/* eslint-disable no-restricted-globals */
import * as S from "effect/Schema";
import { afterAll, beforeAll, describe, expect, it } from "vitest";

import { UTApi, UTFile } from "../src/sdk";
import { UploadThingToken } from "../src/types";
import {
  appUrlPattern,
  fileUrlPattern,
  testToken,
  ufsUrlPattern,
} from "./__test-helpers";

const shouldRun =
  typeof process.env.UPLOADTHING_TEST_TOKEN === "string" &&
  process.env.UPLOADTHING_TEST_TOKEN.length > 0;

describe.runIf(shouldRun)(
  "smoke test with live api",
  { timeout: 15_000 },
  () => {
    const token = shouldRun
      ? process.env.UPLOADTHING_TEST_TOKEN!
      : testToken.encoded;
    const utapi = new UTApi({ token });

    const appId = S.decodeSync(UploadThingToken)(token).appId;

    const localInfo = { totalBytes: 0, filesUploaded: 0 };
    const TEST_APP_LIMIT_BYTES = 2147483648; // free 2GB
    // const TEST_APP_LIMIT_BYTES = 107374182400; // paid 100GB

    // Clean up any files before and after tests
    beforeAll(async () => {
      const { files } = await utapi.listFiles();
      await utapi.deleteFiles(files.map((f) => f.key));
    });
    afterAll(async () => {
      const { files } = await utapi.listFiles();
      await utapi.deleteFiles(files.map((f) => f.key));
    });

    // These will all run in serial

    it("should have no files", async () => {
      const { files, hasMore } = await utapi.listFiles();
      expect(files).toHaveLength(0);
      expect(hasMore).toBe(false);

      const usageInfo = await utapi.getUsageInfo();
      expect(usageInfo).toEqual({
        totalBytes: 0,
        appTotalBytes: 0,
        filesUploaded: 0,
        limitBytes: TEST_APP_LIMIT_BYTES,
      });
      localInfo.totalBytes = usageInfo.totalBytes;
      localInfo.filesUploaded = usageInfo.filesUploaded;
    });

    it("should upload a file", async () => {
      const file = new File(["foo"], "foo.txt", { type: "text/plain" });
      const result = await utapi.uploadFiles(file);
      expect(result).toEqual({
        data: {
          customId: null,
          key: expect.stringMatching(/.+/),
          lastModified: file.lastModified,
          name: "foo.txt",
          size: 3,
          type: "text/plain",
          url: expect.stringMatching(fileUrlPattern()),
          appUrl: expect.stringMatching(appUrlPattern(appId)),
          ufsUrl: expect.stringMatching(ufsUrlPattern(appId)),
          fileHash: expect.any(String),
        },
        error: null,
      });

      const content = await fetch(result.data!.url).then((r) => r.text());
      expect(content).toBe("foo");

      const usageInfo = await utapi.getUsageInfo();
      expect(usageInfo).toEqual({
        totalBytes: 3,
        appTotalBytes: 3,
        filesUploaded: 1,
        limitBytes: TEST_APP_LIMIT_BYTES,
      });

      localInfo.totalBytes += result.data!.size;
      localInfo.filesUploaded++;
    });

    it("should upload a private file", async () => {
      const file = new File(["foo"], "foo.txt", { type: "text/plain" });
      const result = await utapi.uploadFiles(file, {
        acl: "private",
      });
      expect(result).toEqual({
        data: {
          customId: null,
          key: expect.stringMatching(/.+/),
          lastModified: file.lastModified,
          name: "foo.txt",
          size: 3,
          type: "text/plain",
          url: expect.stringMatching(fileUrlPattern()),
          appUrl: expect.stringMatching(appUrlPattern(appId)),
          ufsUrl: expect.stringMatching(ufsUrlPattern(appId)),
          fileHash: expect.any(String),
        },
        error: null,
      });

      const response = await fetch(result.data!.url);
      expect(response.status).toBe(403);

      const { url } = await utapi.getSignedURL(result.data!.key);
      const content = await fetch(url).then((r) => r.text());
      expect(content).toBe("foo");

      localInfo.totalBytes += result.data!.size;
      localInfo.filesUploaded++;
    });

    it("should upload a file from a url", async () => {
      const result = await utapi.uploadFilesFromUrl(
        "https://uploadthing.com/favicon.ico",
      );
      expect(result).toEqual({
        data: {
          customId: null,
          key: expect.stringMatching(/.+/),
          lastModified: expect.any(Number),
          name: "favicon.ico",
          size: expect.any(Number),
          type: "image/vnd.microsoft.icon",
          url: expect.stringMatching(fileUrlPattern()),
          appUrl: expect.stringMatching(appUrlPattern(appId)),
          ufsUrl: expect.stringMatching(ufsUrlPattern(appId)),
          fileHash: expect.any(String),
        },
        error: null,
      });

      localInfo.totalBytes += result.data!.size;
      localInfo.filesUploaded++;
    });

    it("should rename a file with fileKey", async () => {
      const file = new UTFile(["foo"], "bar.txt");
      const result = await utapi.uploadFiles(file);
      const fileKey = result.data!.key;
      expect(result).toEqual({
        data: {
          customId: null,
          key: expect.stringMatching(/.+/),
          lastModified: expect.any(Number),

          name: "bar.txt",
          size: 3,
          type: "text/plain",
          url: expect.stringMatching(fileUrlPattern()),
          appUrl: expect.stringMatching(appUrlPattern(appId)),
          ufsUrl: expect.stringMatching(ufsUrlPattern(appId)),
          fileHash: expect.any(String),
        },
        error: null,
      });

      const { success } = await utapi.renameFiles({
        fileKey,
        newName: "baz.txt",
      });
      expect(success).toBe(true);

      const { files } = await utapi.listFiles();
      expect(files.find((f) => f.key === fileKey)).toHaveProperty(
        "name",
        "baz.txt",
      );

      // FIXME: Bug in uploadthing server
      // const heads = await fetch(result.data!.url).then((r) => r.headers);
      // expect(heads.get("Content-Disposition")).toEqual(
      //   expect.stringContaining("filename=baz.txt"),
      // );

      localInfo.totalBytes += result.data!.size;
      localInfo.filesUploaded++;
    });

    it("should rename a file with customId", async () => {
      const customId = crypto.randomUUID();

      const file = new UTFile(["foo"], "bar.txt", { customId });
      const result = await utapi.uploadFiles(file);
      expect(result).toEqual({
        data: {
          customId: customId,
          key: expect.stringMatching(/.+/),
          lastModified: file.lastModified,
          name: "bar.txt",
          size: 3,
          type: "text/plain",
          url: expect.stringMatching(fileUrlPattern()),
          appUrl: expect.stringMatching(appUrlPattern(appId)),
          ufsUrl: expect.stringMatching(ufsUrlPattern(appId)),
          fileHash: expect.any(String),
        },
        error: null,
      });

      const { success } = await utapi.renameFiles({
        customId,
        newName: "baz.txt",
      });
      expect(success).toBe(true);

      const { files } = await utapi.listFiles();
      expect(files.find((f) => f.customId === customId)).toHaveProperty(
        "name",
        "baz.txt",
      );

      // FIXME: Bug in uploadthing server
      // const heads = await fetch(result.data!.url).then((r) => r.headers);
      // expect(heads.get("Content-Disposition")).toEqual(
      //   expect.stringContaining("filename=baz.txt"),
      // );

      localInfo.totalBytes += result.data!.size;
      localInfo.filesUploaded++;
    });

    it("should update ACL", async () => {
      const file = new File(["foo"], "foo.txt", { type: "text/plain" });
      const result = await utapi.uploadFiles(file);
      const { key } = result.data!;
      expect(result).toEqual({
        data: {
          customId: null,
          key: expect.stringMatching(/.+/),
          lastModified: file.lastModified,
          name: "foo.txt",
          size: 3,
          type: "text/plain",
          url: expect.stringMatching(fileUrlPattern()),
          appUrl: expect.stringMatching(appUrlPattern(appId)),
          ufsUrl: expect.stringMatching(ufsUrlPattern(appId)),
          fileHash: expect.any(String),
        },
        error: null,
      });

      // KV cache upto 60s so we can't test the URL - maybe we need a way to call worker with a KV bypass 🤨

      // const { url } = await utapi.getSignedURL(key);
      const firstChange = await utapi.updateACL(key, "private");
      expect(firstChange.success).toBe(true);
      // await expect(fetch(url)).resolves.toHaveProperty("status", 403);

      const secondChange = await utapi.updateACL(key, "public-read");
      expect(secondChange.success).toBe(true);
      // await expect(fetch(url)).resolves.toHaveProperty("status", 200);

      localInfo.totalBytes += result.data!.size;
      localInfo.filesUploaded++;
    });

    it("should delete a file", async () => {
      const { files } = await utapi.listFiles();
      const someFile = files[0]!;

      const result = await utapi.deleteFiles(someFile.key);
      expect(result).toEqual({
        deletedCount: 1,
        success: true,
      });

      localInfo.totalBytes -= someFile.size;
      localInfo.filesUploaded--;
    });

    it("should have correct usage info", async () => {
      const usageInfo = await utapi.getUsageInfo();
      expect(usageInfo).toEqual({
        totalBytes: localInfo.totalBytes,
        appTotalBytes: localInfo.totalBytes,
        filesUploaded: localInfo.filesUploaded,
        limitBytes: TEST_APP_LIMIT_BYTES,
      });
    });
  },
);
