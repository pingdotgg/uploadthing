import {
  generateMimeTypes,
  generatePermittedFileTypes,
  genUploader,
} from "uploadthing/client";
import { EndpointMetadata } from "uploadthing/types";

import type { OurFileRouter } from "../../server/src/router";

const BASE_URL = "http://localhost:3003";

export const uploadFiles = genUploader<OurFileRouter>({
  url: BASE_URL,
  package: "vanilla",
});

export const setupUploader = (el: HTMLFormElement) => {
  const form = el;
  const input = form.querySelector<HTMLInputElement>("input[type=file]")!;
  const button = form.querySelector<HTMLButtonElement>("button")!;

  // Hook up form submission
  form.addEventListener("submit", async (e) => {
    e.preventDefault();
    const files = Array.from(input.files || []);
    button.disabled = true;
    const res = await uploadFiles("videoAndImage", {
      files,
      onUploadBegin: (opts) => console.log("Uploading", opts.file),
      onUploadProgress: (opts) => console.log("Upload progress", opts),
    });
    form.reset();
    alert(`Upload complete! ${res.length} files uploaded`);
    button.disabled = false;
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
