// @vitest-environment happy-dom
import "@testing-library/jest-dom/vitest";

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

import { createUploadthing, extractRouterConfig } from "uploadthing/server";

import { generateUploadButton } from "../src";

const noop = vi.fn();

const f = createUploadthing();
const testRouter = {
  image: f({ image: {} }).onUploadComplete(noop),
  audio: f({ audio: {} }).onUploadComplete(noop),
  pdf: f({ "application/pdf": {} }).onUploadComplete(noop),
  multi: f({ image: { maxFileCount: 4 } }).onUploadComplete(noop),
};

const UploadButton = generateUploadButton<typeof testRouter>();

const utGet = vi.fn<[Request]>();
const utPost = vi.fn<[{ request: Request; body: any }]>();
const server = setupServer(
  http.get("/api/uploadthing", ({ request }) => {
    utGet(request);
    return HttpResponse.json(extractRouterConfig(testRouter));
  }),
  http.post("/api/uploadthing", async ({ request }) => {
    const body = await request.json();
    utPost({ request, body });
    return HttpResponse.json([
      // empty array, we're not testing the upload endpoint here
      // we have other tests for that...
    ]);
  }),
);

beforeAll(() => server.listen());
afterEach(() => {
  server.resetHandlers();
  cleanup();
});
afterAll(() => server.close());

describe("UploadButton - basic", () => {
  it("fetches and displays route config", async () => {
    const utils = render(<UploadButton endpoint="image" />);
    const label = utils.container.querySelector("label");

    expect(label).toHaveTextContent("Loading...");
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
            files: [{ name: "foo.txt", type: "text/plain", size: 3 }],
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
