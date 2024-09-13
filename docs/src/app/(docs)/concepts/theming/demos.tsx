"use client";

import { UploadButton, UploadDropzone } from "@/components/UploadThing";

export const TWClassName1 = () => (
  <UploadButton
    endpoint="mockRoute"
    className="ut-button:bg-red-500 ut-button:ut-readying:bg-red-500/50 dark:ut-allowed-content:text-white mt-4"
    content={{
      allowedContent: "Allowed content",
      button: "Ready",
    }}
    // @ts-expect-error - internal prop
    __internal_state="ready"
  />
);

export const TWClassName2 = () => (
  <UploadButton
    endpoint="mockRoute"
    className="ut-button:bg-red-500 ut-button:ut-readying:bg-red-500/50 dark:ut-allowed-content:text-white mt-4"
    content={{
      allowedContent: "Allowed content",
    }}
    // @ts-expect-error - internal prop
    __internal_button_disabled
    __internal_state="readying"
  />
);

export const TWClassName3 = () => (
  <UploadDropzone
    endpoint="mockRoute"
    className="ut-allowed-content:text-blue-100 ut-label:text-lg ut-allowed-content:ut-uploading:text-red-300 mt-4 bg-slate-800"
    content={{
      allowedContent: "Allowed content",
      button: "Ready",
    }}
    // @ts-expect-error - internal prop
    __internal_state="ready"
    __internal_button_disabled
    __internal_dropzone_disabled
    __internal_show_button
  />
);

export const TWClassName4 = () => (
  <UploadDropzone
    endpoint="mockRoute"
    className="ut-label:text-lg ut-allowed-content:ut-uploading:text-red-300 mt-4 bg-slate-800"
    content={{
      allowedContent: "Allowed content",
    }}
    // @ts-expect-error - internal prop
    __internal_state="uploading"
    __internal_button_disabled
    __internal_dropzone_disabled
    __internal_show_button
  />
);

export const TWClassName5 = () => (
  <UploadButton
    endpoint="mockRoute"
    appearance={{
      button:
        "ut-ready:bg-green-500 ut-uploading:cursor-not-allowed rounded-r-none bg-red-500 bg-none after:bg-orange-400",
      container:
        "mx-auto w-max flex-row rounded-md border-cyan-300 bg-slate-800",
      allowedContent:
        "flex h-8 flex-col items-center justify-center px-2 text-white",
    }}
    content={{
      allowedContent: "Allowed content",
    }}
    // @ts-expect-error - internal prop
    __internal_state="uploading"
    __internal_button_disabled
  />
);

export const TWClassName6 = () => (
  <UploadButton
    endpoint="mockRoute"
    appearance={{
      button:
        "ut-ready:bg-green-500 ut-uploading:cursor-not-allowed rounded-r-none bg-red-500 bg-none after:bg-orange-400",
      container:
        "mx-auto w-max flex-row rounded-md border-cyan-300 bg-slate-800 mt-4",
      allowedContent:
        "flex h-8 flex-col items-center justify-center px-2 text-white",
    }}
    content={{
      allowedContent: "Allowed content",
      button: "Upload files",
    }}
    // @ts-expect-error - internal prop
    __internal_state="ready"
    __internal_button_disabled
  />
);

export const CustomClassClassName1 = () => (
  <UploadButton
    endpoint="mockRoute"
    className="custom-class dark:ut-allowed-content:text-white"
    content={{
      allowedContent: "Allowed content",
      button: "Ready",
    }}
    // @ts-expect-error - internal prop
    __internal_state="ready"
    __internal_button_disabled
  />
);

export const CustomClassClassName2 = () => (
  <UploadButton
    endpoint="mockRoute"
    className="custom-class dark:ut-allowed-content:text-white"
    content={{
      allowedContent: "Allowed content",
      button: "Readying",
    }}
    appearance={{
      container: {
        marginTop: "1rem",
      },
    }}
    // @ts-expect-error - internal prop
    __internal_state="readying"
    __internal_button_disabled
  />
);

export const CustomClassClassName3 = () => (
  <UploadButton
    endpoint="mockRoute"
    className="custom-class dark:ut-allowed-content:text-white"
    content={{
      allowedContent: "Allowed content",
    }}
    appearance={{
      container: {
        marginTop: "1rem",
      },
    }}
    // @ts-expect-error - internal prop
    __internal_state="uploading"
    __internal_button_disabled
    __internal_upload_progress={40}
  />
);

export const CustomClassAppearance1 = () => (
  <UploadButton
    endpoint="mockRoute"
    className="dark:ut-allowed-content:text-white"
    appearance={{
      button({ ready, isUploading }) {
        return `custom-button ${
          ready ? "custom-button-ready" : "custom-button-not-ready"
        } ${isUploading ? "custom-button-uploading" : ""}`;
      },
      container: "custom-container",
      allowedContent: "custom-allowed-content",
    }}
    content={{
      allowedContent: "Allowed content",
      button: "Upload files",
    }}
    // @ts-expect-error - internal prop
    __internal_state="ready"
    __internal_button_disabled
  />
);

export const CustomClassAppearance2 = () => (
  <UploadButton
    endpoint="mockRoute"
    className="dark:ut-allowed-content:text-white"
    appearance={{
      button({ ready, isUploading }) {
        return `custom-button ${
          ready ? "custom-button-ready" : "custom-button-not-ready"
        } ${isUploading ? "custom-button-uploading" : ""}`;
      },
      container: "custom-container",
      allowedContent: "custom-allowed-content",
    }}
    content={{
      allowedContent: "Allowed content",
    }}
    // @ts-expect-error - internal prop
    __internal_state="readying"
    __internal_button_disabled
  />
);

export const CustomClassAppearance3 = () => (
  <UploadButton
    endpoint="mockRoute"
    className="dark:ut-allowed-content:text-white"
    appearance={{
      button({ ready, isUploading }) {
        return `custom-button ${
          ready ? "custom-button-ready" : "custom-button-not-ready"
        } ${isUploading ? "custom-button-uploading" : ""}`;
      },
      container: "custom-container",
      allowedContent: "custom-allowed-content",
    }}
    content={{
      allowedContent: "Allowed content",
    }}
    // @ts-expect-error - internal prop
    __internal_state="uploading"
    __internal_button_disabled
    __internal_upload_progress={40}
  />
);

export const InlineClassAppearance1 = () => (
  <UploadButton
    endpoint="mockRoute"
    appearance={{
      button({ ready, isUploading }) {
        return {
          fontSize: "1.6rem",
          color: "black",
          ...(ready && { color: "#ecfdf5" }),
          ...(isUploading && { color: "#d1d5db" }),
        };
      },
      container: {
        marginTop: "1rem",
      },
      allowedContent: {
        color: "#a1a1aa",
      },
    }}
    content={{
      allowedContent: "Allowed content",
    }}
    // @ts-expect-error - internal prop
    __internal_button_disabled
    __internal_state="readying"
  />
);

export const InlineClassAppearance2 = () => (
  <UploadButton
    endpoint="mockRoute"
    appearance={{
      button({ ready, isUploading }) {
        return {
          fontSize: "1.6rem",
          color: "black",
          ...(ready && { color: "#ecfdf5" }),
          ...(isUploading && { color: "#d1d5db" }),
        };
      },
      container: {
        marginTop: "1rem",
      },
      allowedContent: {
        color: "#a1a1aa",
      },
    }}
    content={{
      allowedContent: "Allowed content",
    }}
    // @ts-expect-error - internal prop
    __internal_button_disabled
    __internal_state="ready"
  />
);

export const InlineClassAppearance3 = () => (
  <UploadButton
    endpoint="mockRoute"
    appearance={{
      button({ ready, isUploading }) {
        return {
          fontSize: "1.6rem",
          color: "black",
          ...(ready && { color: "#ecfdf5" }),
          ...(isUploading && { color: "#d1d5db" }),
        };
      },
      container: {
        marginTop: "1rem",
      },
      allowedContent: {
        color: "#a1a1aa",
      },
    }}
    content={{
      allowedContent: "Allowed content",
    }}
    // @ts-expect-error - internal prop
    __internal_button_disabled
    __internal_state="uploading"
  />
);

export const CustomContent1 = () => (
  <UploadButton
    endpoint="mockRoute"
    className="ut-allowed-content:text-zinc-500"
    content={{
      button({ ready }) {
        if (ready) return <div>Upload stuff</div>;

        return "Getting ready...";
      },
      allowedContent({ ready, fileTypes, isUploading }) {
        if (!ready) return "Checking what you allow";
        if (isUploading) return "Seems like stuff is uploading";
        return `Stuff you can upload: ${fileTypes.join(", ")}`;
      },
    }}
    // @ts-expect-error - internal prop
    __internal_button_disabled
    __internal_state="readying"
  />
);

export const CustomContent2 = () => (
  <UploadButton
    endpoint="mockRoute"
    content={{
      button({ ready }) {
        if (ready) return <div>Upload stuff</div>;

        return "Getting ready...";
      },
      allowedContent({ ready, fileTypes, isUploading }) {
        if (!ready) return "Checking what you allow";
        if (isUploading) return "Seems like stuff is uploading";
        return `Stuff you can upload: ${fileTypes.join(", ")}`;
      },
    }}
    appearance={{
      container: {
        marginTop: "1rem",
      },
      allowedContent: "text-zinc-500",
    }}
    // @ts-expect-error - internal prop
    __internal_button_disabled
    __internal_state="ready"
  />
);

export const CustomContent3 = () => (
  <UploadButton
    endpoint="mockRoute"
    content={{
      button({ ready }) {
        if (ready) return <div>Upload stuff</div>;

        return "Getting ready...";
      },
      allowedContent({ ready, fileTypes, isUploading }) {
        if (!ready) return "Checking what you allow";
        if (isUploading) return "Seems like stuff is uploading";
        return `Stuff you can upload: ${fileTypes.join(", ")}`;
      },
    }}
    appearance={{
      container: {
        marginTop: "1rem",
      },
      allowedContent: "text-zinc-500",
    }}
    // @ts-expect-error - internal prop
    __internal_button_disabled
    __internal_state="uploading"
  />
);
