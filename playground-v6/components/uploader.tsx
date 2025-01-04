"use client";

import { useActionState, useEffect, useRef } from "react";
import { useRouter } from "next/navigation";

import { generateReactHelpers, generateUploadButton } from "@uploadthing/react";

import { UploadRouter } from "../app/api/uploadthing/route";
import { uploadFiles } from "../lib/actions";
import { Input, Label } from "./fieldset";

export const UTButton = generateUploadButton<UploadRouter>();
export const { useUploadThing } = generateReactHelpers<UploadRouter>();

function ServerUploader(props: { type: "file" | "url" }) {
  const formRef = useRef<HTMLFormElement>(null);
  const [state, dispatch, isUploading] = useActionState(uploadFiles, {
    success: false,
    error: "",
  });

  useEffect(() => {
    if (state.success === false && state.error) {
      window.alert(state.error);
    }
  }, [state.success]);

  return (
    <form ref={formRef} action={dispatch}>
      <div className="space-y-1">
        <Label>Upload (server {props.type})</Label>
        <Input
          name="files"
          multiple
          disabled={isUploading}
          className="h-10 p-0 file:me-3 file:border-0 file:border-e"
          type={props.type === "file" ? "file" : "text"}
          onChange={() => {
            if (props.type === "file") {
              formRef.current?.requestSubmit();
              return;
            }
          }}
        />
      </div>

      <noscript>
        <button type="submit" disabled={isUploading}>
          {isUploading ? "⏳" : `Upload (server ${props.type})`}
        </button>
      </noscript>
    </form>
  );
}

export function Uploader() {
  const router = useRouter();

  return (
    <div className="flex gap-4">
      <div className="space-y-1">
        <Label>Upload (client)</Label>
        <UTButton
          endpoint="anything"
          input={{}}
          onUploadError={(error) => {
            window.alert(error.message);
          }}
          onClientUploadComplete={() => {
            router.refresh();
          }}
          content={{
            allowedContent: <></>,
            button: ({ isUploading }) =>
              isUploading ? null : "Upload (Client)",
          }}
          appearance={{
            button: "!text-sm/6",
            allowedContent: "!h-0",
          }}
        />
      </div>
      <ServerUploader type="file" />
      <ServerUploader type="url" />
    </div>
  );
}
