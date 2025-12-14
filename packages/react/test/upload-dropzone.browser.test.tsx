import { page } from "@vitest/browser/context";
import { http, HttpResponse } from "msw";
import { setupWorker } from "msw/browser";
import { afterAll, beforeAll, describe, expect, it, vi } from "vitest";
import { render } from "vitest-browser-react";

import { createRouteHandler, createUploadthing } from "uploadthing/server";

import { generateUploadDropzone } from "../src";

const noop = vi.fn();

const f = createUploadthing();
const testRouter = {
  image: f({ image: {} }).onUploadComplete(noop),
  audio: f({ audio: {} }).onUploadComplete(noop),
  pdf: f({ "application/pdf": {} }).onUploadComplete(noop),
  multi: f({ image: { maxFileCount: 4 } }).onUploadComplete(noop),
};
const routeHandler = createRouteHandler({
  router: testRouter,
  config: {
    token:
      "eyJhcHBJZCI6ImFwcC0xIiwiYXBpS2V5Ijoic2tfZm9vIiwicmVnaW9ucyI6WyJmcmExIl19",
  },
});
const UploadDropzone = generateUploadDropzone<typeof testRouter>();

const utGet = vi.fn<(req: Request) => void>();
const utPost =
  vi.fn<({ request, body }: { request: Request; body: any }) => void>();

const worker = setupWorker(
  http.get("/api/uploadthing", ({ request }) => {
    utGet(request);
    return routeHandler(request);
  }),
  http.post("/api/uploadthing", async ({ request }) => {
    const body = await request.clone().json();
    utPost({ request, body });
    return routeHandler(request);
  }),
  http.all<{ key: string }>(
    "https://fra1.ingest.uploadthing.com/:key",
    ({ params }) => {
      return HttpResponse.json({ url: "https://app-1.ufs.sh/f/" + params.key });
    },
  ),
);

beforeAll(() => worker.start({ quiet: true }));
afterAll(() => worker.stop());

describe("UploadDropzone - basic", () => {
  it("fetches and displays route config", async () => {
    const utils = await render(<UploadDropzone endpoint="image" />);
    const label = utils.container.querySelector("label");

    if (!label) throw new Error("No label found");

    // Previously, when component was disabled, it would show "Loading..."
    // expect(label).toHaveTextContent("Loading...");

    // then eventually we load in the data, and we should be in the ready state
    await vi.waitFor(() =>
      expect(label).toHaveAttribute("data-state", "ready"),
    );
    expect(label).toHaveTextContent("Choose a file or drag and drop");
    expect(label).not.toHaveTextContent("(s)");

    expect(utGet).toHaveBeenCalledOnce();
    await expect.element(page.getByText("Image (4MB)")).toBeVisible();
  });

  it("shows plural when maxFileCount is > 1", async () => {
    const utils = await render(<UploadDropzone endpoint="multi" />);
    const label = utils.container.querySelector("label");

    if (!label) throw new Error("No label found");

    // Previously, when component was disabled, it would show "Loading..."
    // expect(label).toHaveTextContent("Loading...");

    // then eventually we load in the data, and we should be in the ready state
    await vi.waitFor(() =>
      expect(label).toHaveAttribute("data-state", "ready"),
    );
    expect(label).toHaveTextContent("Choose file(s) or drag and drop");
  });
});
