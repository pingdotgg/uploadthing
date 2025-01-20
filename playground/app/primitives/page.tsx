"use client";

import { Button } from "../../components/button";
import { Label } from "../../components/fieldset";
import { Code, Subheading } from "../../components/text";
import { UT } from "../../lib/uploadthing";

export function CustomUploader() {
  return (
    <UT.Root
      endpoint={(rr) => rr.anything}
      input={{}}
      onClientUploadComplete={(res) => {
        console.log(`onClientUploadComplete`, res);
        alert("Upload Completed");
      }}
      onUploadBegin={() => {
        console.log("upload begin");
      }}
      config={{
        appendOnPaste: true,
      }}
    >
      <Label>Custom Uploader</Label>
      <UT.Dropzone className="mt-2">
        {({ dropzone, state, uploadProgress }) => (
          <div
            data-dragactive={dropzone?.isDragActive}
            className="flex flex-col items-center rounded-md border-2 border-dashed border-zinc-200 p-4 data-[dragactive=true]:border-zinc-400"
          >
            <Subheading>Drag and drop</Subheading>
            <UT.Button as={Button} color="red" className="mt-2 px-4 py-2">
              {state === "uploading" ? "Uploading" : "Upload file"}
              {!!uploadProgress && ` ${uploadProgress}%`}
            </UT.Button>
            <UT.AllowedContent as={Code} className="mt-2" />
          </div>
        )}
      </UT.Dropzone>
    </UT.Root>
  );
}

export default function Page() {
  return (
    <div className="p-4">
      <CustomUploader />
    </div>
  );
}
