// @vitest-environment happy-dom
/// <reference types="@testing-library/jest-dom/vitest" />

import { cleanup, fireEvent, render, waitFor } from "@testing-library/react";
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

import { generateUploadButton } from "../src";

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
const UploadButton = generateUploadButton<typeof testRouter>();

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

/**
 * This is a basic suite of tests for the UploadButton component.
 * This is not meant to be a comprehensive test suite, but rather a
 * basic check of core functionality.
 *
 * In the future, the goal is to use these and other tests to ensure
 * consistency across the components in alll of the supported libraries
 * (React, Solid, Svelte, Vue, etc.). Ideally core test logic should be
 * shared as much as possible, so that we don;t have to maintain the test
 * implementations in addition to the component implementations.
 *
 * In #886, we attempted to bring all of the libraries in line with each
 * other, and at that time we manually went verified the following:
 * - components all accept the same props/have similar APIs
 * - styles match across libraries in each component state
 * - copy matches across libraries
 * - components are reactive
 * - selecting files changes the text on the button
 * - uploading changes style and text on button
 * - paste works
 * - abort works
 *
 * Some other items we did not check but probably should have:
 * - functions are triggered at the right times
 * - onChange should occur on select, clear, and drop
 * - custom styling overrides are available and functioning (and always apply
 *   to the same parts of the component)
 */

describe("UploadButton - basic", () => {
  it("fetches and displays route config", async () => {
    const utils = render(<UploadButton endpoint="image" />);
    const label = utils.container.querySelector("label");

    if (!label) throw new Error("No label found");

    // Previously, when component was disabled, it would show "Loading..."
    // expect(label).toHaveTextContent("Loading...");

    // then eventually we load in the data, and we should be in the ready state
    await waitFor(() => expect(label).toHaveAttribute("data-state", "ready"));
    expect(label).toHaveTextContent("Choose File");

    expect(utGet).toHaveBeenCalledOnce();
    expect(utils.getByText("Image (4MB)")).toBeInTheDocument();
  });

  it("picks up route config from global and skips fetch", async () => {
    (window as any).__UPLOADTHING = extractRouterConfig(testRouter);

    const utils = render(<UploadButton endpoint="image" />);
    expect(utils.getByText("Image (4MB)")).toBeInTheDocument();
    expect(utGet).not.toHaveBeenCalled();

    delete (window as any).__UPLOADTHING;
  });

  it("requests URLs when a file is selected", async () => {
    const utils = render(<UploadButton endpoint="image" />);
    const label = utils.container.querySelector("label");
    await waitFor(() => expect(label).toHaveAttribute("data-state", "ready"));

    fireEvent.change(utils.getByLabelText("Choose File"), {
      target: { files: [new File(["foo"], "foo.txt", { type: "text/plain" })] },
    });
    await waitFor(() => {
      expect(utPost).toHaveBeenCalledWith(
        expect.objectContaining({
          body: {
            files: [
              {
                name: "foo.txt",
                type: "text/plain",
                size: 3,
                lastModified: expect.any(Number),
              },
            ],
          },
        }),
      );
    });
  });

  it("manual mode requires extra click", async () => {
    const utils = render(
      <UploadButton endpoint="image" config={{ mode: "manual" }} />,
    );
    const label = utils.container.querySelector("label");
    await waitFor(() => expect(label).toHaveAttribute("data-state", "ready"));

    fireEvent.change(utils.getByLabelText("Choose File"), {
      target: { files: [new File([""], "foo.txt")] },
    });
    expect(label).toHaveTextContent("Upload 1 file");

    fireEvent.click(label!);
    await waitFor(() => {
      expect(utPost).toHaveBeenCalledWith(
        expect.objectContaining({
          body: {
            files: [expect.objectContaining({ name: "foo.txt" })],
          },
        }),
      );
    });
  });

  // https://discord.com/channels/966627436387266600/1102510616326967306/1267098160468197409
  it.skip("disabled", async () => {
    const utils = render(<UploadButton endpoint="image" disabled />);
    const label = utils.container.querySelector("label");
    await waitFor(() => expect(label).toHaveTextContent("Choose File"));
    expect(label).toHaveAttribute("disabled");
  });
});

describe("UploadButton - lifecycle hooks", () => {
  it("onBeforeUploadBegin alters the requested files", async () => {
    const utils = render(
      <UploadButton
        endpoint="image"
        onBeforeUploadBegin={() => {
          return [new File([""], "bar.txt")];
        }}
      />,
    );
    await waitFor(() => {
      expect(utils.getByText("Choose File")).toBeInTheDocument();
    });

    fireEvent.change(utils.getByLabelText("Choose File"), {
      target: { files: [new File([""], "foo.txt")] },
    });
    await waitFor(() => {
      expect(utPost).toHaveBeenCalledWith(
        expect.objectContaining({
          body: {
            files: [expect.objectContaining({ name: "bar.txt" })],
          },
        }),
      );
    });
  });

  it("onUploadBegin runs before uploading", async () => {
    const onUploadBegin = vi.fn();
    const utils = render(
      <UploadButton endpoint="multi" onUploadBegin={onUploadBegin} />,
    );
    await waitFor(() => {
      expect(utils.getByText("Choose File(s)")).toBeInTheDocument();
    });

    fireEvent.change(utils.getByLabelText("Choose File(s)"), {
      target: { files: [new File([""], "foo.png"), new File([""], "bar.png")] },
    });
    await waitFor(() => {
      expect(onUploadBegin).toHaveBeenCalledTimes(2);
    });
    expect(onUploadBegin).toHaveBeenCalledWith("foo.png");
    expect(onUploadBegin).toHaveBeenCalledWith("bar.png");
  });
});

describe("UploadButton - Theming", () => {
  it("renders custom styles", async () => {
    const utils = render(
      <UploadButton
        endpoint="image"
        appearance={{
          button: { backgroundColor: "red" },
        }}
      />,
    );
    await waitFor(() => {
      expect(utils.getByText("Choose File")).toHaveStyle({
        backgroundColor: "red",
      });
    });
  });
});

describe("UploadButton - Content Customization", () => {
  it("renders custom content", async () => {
    const utils = render(
      <UploadButton
        endpoint="image"
        content={{
          allowedContent: "Allowed content",
        }}
      />,
    );
    await waitFor(() => {
      expect(utils.getByText("Allowed content")).toBeInTheDocument();
    });
  });
});
