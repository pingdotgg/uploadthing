import {
  generateMimeTypes,
  generatePermittedFileTypes,
  genUploader,
  UploadAbortedError,
} from "uploadthing/client";
import { EndpointMetadata } from "uploadthing/types";

import type { OurFileRouter } from "../../server/src/router";

const BASE_URL = "http://localhost:3000";

export const uploadFiles = genUploader<OurFileRouter>({
  url: BASE_URL,
  package: "vanilla",
});

export const setupUploader = (el: HTMLFormElement) => {
  const form = el;
  const input = form.querySelector<HTMLInputElement>("input[type=file]")!;
  const button = form.querySelector<HTMLButtonElement>("button")!;
  const abortButton = document.querySelector<HTMLButtonElement>("#abort")!;
  const ac = new AbortController();

  // Hook up abort button
  abortButton.addEventListener("click", () => ac.abort());

  // Hook up form submission
  form.addEventListener("submit", async (e) => {
    e.preventDefault();
    const files = Array.from(input.files || []);
    button.disabled = true;
    abortButton.disabled = false;
    const res = await uploadFiles("videoAndImage", {
      files,
      signal: ac.signal,
    }).catch((error) => {
      if (error instanceof UploadAbortedError) {
        alert("Upload aborted");
      }
      throw error;
    });
    form.reset();
    alert(`Upload complete! ${res.length} files uploaded`);
    button.disabled = false;
    abortButton.disabled = true;
  });

  // Sync accept and multiple attributes with the server state
  fetch(new URL("/api/uploadthing", BASE_URL))
    .then((res) => res.json() as Promise<EndpointMetadata>)
    .then((json) => json.find(({ slug }) => slug === "videoAndImage")?.config)
    .then((config) => {
      const { fileTypes, multiple } = generatePermittedFileTypes(config);
      const mimes = generateMimeTypes(fileTypes);
      input.accept = mimes.join(", ");
      input.multiple = multiple;
    });
};
