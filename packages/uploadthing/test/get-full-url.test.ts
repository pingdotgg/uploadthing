import { describe, expect, it } from "vitest";

import { getFullApiUrl } from "../src/client";

describe("getFullApiUrl", () => {
  it("should return the provided url if it is already absolute", () => {
    const url = "https://example.com/foo/bar";
    expect(getFullApiUrl(url)).toBe(url);
  });

  it("should add `window.location.origin` if the url is relative and request is clientside", () => {
    // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment
    globalThis.window = {
      location: {
        host: "http://example.com",
      },
    } as any;

    expect(getFullApiUrl("/foo/bar")).toBe("http://example.com/foo/bar");

    // @ts-expect-error - delete globalThis
    delete globalThis.window;
  });

  it("should take VERCEL_URL if present and url is relative", () => {
    process.env.VERCEL_URL = "https://example.com";

    expect(getFullApiUrl("/foo/bar")).toBe("https://example.com/foo/bar");

    delete process.env.VERCEL_URL;
  });

  it("assumes localhost if no VERCEL_URL and url is relative", () => {
    expect(getFullApiUrl("/foo/bar")).toBe("http://localhost:3000/foo/bar");
  });

  it("should use `/api/uploadthing` pathname if no url is provided", () => {
    expect(getFullApiUrl()).toBe("http://localhost:3000/api/uploadthing");
  });
});
