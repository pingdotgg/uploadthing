import { process } from "std-env";
import { describe, expect, it } from "vitest";

import { resolveMaybeUrlArg } from "../src/utils";

describe("resolveMaybeUrlArg", () => {
  it("should return the provided url if it is already absolute", () => {
    const url = "https://example.com/foo/bar";
    expect(resolveMaybeUrlArg(url).href).toBe(url);
  });

  it("should add `window.location.origin` if the url is relative and request is clientside", () => {
    global.window = {
      location: {
        origin: "http://example.com",
      },
    } as any;

    expect(resolveMaybeUrlArg("/foo/bar").href).toBe(
      "http://example.com/foo/bar",
    );

    // @ts-expect-error - delete globalThis
    delete global.window;
  });

  it("should take VERCEL_URL if present and url is relative", () => {
    process.env.VERCEL_URL = "example.com";

    expect(resolveMaybeUrlArg("/foo/bar").href).toBe(
      "https://example.com/foo/bar",
    );

    delete process.env.VERCEL_URL;
  });

  it("assumes localhost if no VERCEL_URL and url is relative", () => {
    expect(resolveMaybeUrlArg("/foo/bar").href).toBe(
      "http://localhost:3000/foo/bar",
    );
  });

  it("should use `/api/uploadthing` pathname if no url is provided", () => {
    expect(resolveMaybeUrlArg("http://example.com").href).toBe(
      "http://example.com/api/uploadthing",
    );
  });

  it("should add `/api/uploadthing` if url only has a origin", () => {
    expect(resolveMaybeUrlArg("http://example.com").href).toBe(
      "http://example.com/api/uploadthing",
    );
  });
});
