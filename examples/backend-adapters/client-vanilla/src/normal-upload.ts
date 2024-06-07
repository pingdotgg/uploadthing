import { UploadAbortedError } from "uploadthing/client";

import { getInputProps, uploadFiles } from "./uploadthing";

/**
 * This sets up a simple uplaoder that you call once
 * (uploadFiles) and be done with it.
 * You may abort the upload, but you cannot pause or resume it.
 * If you need more control, checkout the resumable example instead
 *
 * @param el The container element with the form and all inside
 */
export const setupUploader = (el: HTMLDivElement) => {
  const form = el.querySelector<HTMLFormElement>("form")!;
  const input = form.querySelector<HTMLInputElement>("input[type=file]")!;
  const submitButton = form.querySelector<HTMLButtonElement>(
    "button[type=submit]",
  )!;
  const progressBar = el.querySelector<HTMLProgressElement>("progress")!;
  const abortButton = el.querySelector<HTMLButtonElement>(
    "button[type=button]",
  )!;
  const ac = new AbortController();

  // Hook up abort button
  abortButton.addEventListener("click", () => ac.abort());

  // Hook up form submission
  form.addEventListener("submit", async (e) => {
    e.preventDefault();
    const files = Array.from(input.files || []);

    // Disable the form and the upload button
    submitButton.disabled = true;
    abortButton.disabled = false;
    progressBar.style.display = "block";

    // 👇👇👇 THIS IS THE ACTUAL UPLOAD  👇👇👇
    const res = await uploadFiles("videoAndImage", {
      files,
      signal: ac.signal,
      onUploadProgress: ({ totalProgress }) => {
        progressBar.value = totalProgress;
      },
    }).catch((error) => {
      if (error instanceof UploadAbortedError) {
        setTimeout(() => alert("Upload aborted"));
      }
      throw error;
    });

    // Reset the form and acknowledge the upload is completed
    form.reset();
    setTimeout(() => alert(`Upload complete! ${res.length} files uploaded`));
    submitButton.disabled = false;
    progressBar.value = 0;
    progressBar.style.display = "none";
    abortButton.disabled = true;
  });

  // Sync accept and multiple attributes with the server state
  getInputProps("videoAndImage").then((props) => {
    input.accept = props.accept;
    input.multiple = props.multiple;
  });
};
