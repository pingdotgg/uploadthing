// @vitest-environment happy-dom
/// <reference types="@testing-library/jest-dom/vitest" />

import { cleanup, render, waitFor } from "@testing-library/react";
import { http, HttpResponse } from "msw";
import { setupServer } from "msw/node";
import {
  afterAll,
  afterEach,
  beforeAll,
  describe,
  expect,
  it,
  vi,
} from "vitest";

import {
  createRouteHandler,
  createUploadthing,
  extractRouterConfig,
} from "uploadthing/server";

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

const server = setupServer(
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
    ({ request, params }) => {
      return HttpResponse.json({ url: "https://utfs.io/f/" + params.key });
    },
  ),
);

beforeAll(() => server.listen());
afterEach(() => {
  server.resetHandlers();
  cleanup();
});
afterAll(() => server.close());

describe("UploadDropzone - basic", () => {
  it("fetches and displays route config", async () => {
    const utils = render(<UploadDropzone endpoint="image" />);
    const label = utils.container.querySelector("label");

    if (!label) throw new Error("No label found");

    // Previously, when component was disabled, it would show "Loading..."
    // expect(label).toHaveTextContent("Loading...");

    // then eventually we load in the data, and we should be in the ready state
    await waitFor(() => expect(label).toHaveAttribute("data-state", "ready"));
    expect(label).toHaveTextContent("Choose a file or drag and drop");
    expect(label).not.toHaveTextContent("(s)");

    expect(utGet).toHaveBeenCalledOnce();
    expect(utils.getByText("Image (4MB)")).toBeInTheDocument();
  });

  it("shows plural when maxFileCount is > 1", async () => {
    const utils = render(<UploadDropzone endpoint="multi" />);
    const label = utils.container.querySelector("label");

    if (!label) throw new Error("No label found");

    // Previously, when component was disabled, it would show "Loading..."
    // expect(label).toHaveTextContent("Loading...");

    // then eventually we load in the data, and we should be in the ready state
    await waitFor(() => expect(label).toHaveAttribute("data-state", "ready"));
    expect(label).toHaveTextContent("Choose file(s) or drag and drop");
  });
});
