"use client";

import { UploadIcon } from "@radix-ui/react-icons";
import { toast } from "sonner";
import { twMerge } from "tailwind-merge";
import { z } from "zod";

import { useDropzone } from "@uploadthing/react";
import { FileWithState } from "@uploadthing/shared";

import { Button } from "~/components/ui/button";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  useForm,
} from "~/components/ui/form";
import { useUploadThing } from "~/uploadthing/client";
import { fileWithStateValidator } from "~/utils";

const MyDropzone = (props: {
  files: FileWithState[];
  onFilesChange: (files: FileWithState[]) => void;
}) => {
  const { routeConfig, startUpload } = useUploadThing("imageUploader", {
    files: props.files,
    onFilesChange: props.onFilesChange,
  });
  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    routeConfig,
    onDrop: (files) => {
      const updatedFiles = [...props.files, ...files];
      props.onFilesChange(updatedFiles);
      startUpload(updatedFiles);
    },
  });

  return (
    <div
      {...getRootProps()}
      className={twMerge(
        "border-muted-foreground/25 hover:bg-muted/25 group relative grid h-52 w-full cursor-pointer place-items-center rounded-lg border-2 border-dashed px-5 py-2.5 text-center transition",
        "ring-offset-background focus-visible:ring-ring focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-2",
        isDragActive && "border-muted-foreground/50",
      )}
    >
      <input {...getInputProps()} />
      <div className="flex flex-col items-center justify-center gap-4 sm:px-5">
        <div className="rounded-full border border-dashed p-3">
          <UploadIcon
            className="text-muted-foreground size-7"
            aria-hidden="true"
          />
        </div>
        <div className="space-y-px">
          <p className="font-medium">
            Drag {`'n'`} drop files here, or click to select files
          </p>
          <p className="text-muted-foreground/70 text-sm">
            You can upload: {Object.keys(routeConfig ?? {}).join(", ")}
          </p>
        </div>
      </div>
    </div>
  );
};

/**
 * A demo using RHF with a custom dropzone components
 */
export const SimpleRHFDemo = () => {
  const form = useForm({
    schema: z.object({
      images: fileWithStateValidator.array(),
    }),
    defaultValues: {
      images: [],
    },
    mode: "onChange",
  });

  const onSubmit = form.handleSubmit((data) => {
    toast(
      <pre className="w-full rounded bg-zinc-300 p-1 font-mono">
        {JSON.stringify(data, null, 4)}
      </pre>,
    );
    form.reset();
  });

  return (
    <div className="flex flex-col gap-8 p-16">
      <Form {...form}>
        <form
          onSubmit={onSubmit}
          className="flex flex-col gap-2 rounded border p-16"
        >
          <FormField
            control={form.control}
            name="images"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Images</FormLabel>
                <FormControl>
                  <MyDropzone
                    files={field.value}
                    onFilesChange={field.onChange}
                  />
                </FormControl>
              </FormItem>
            )}
          />

          <Button
            type="submit"
            className="w-full"
            disabled={!form.formState.isValid}
          >
            Submit
          </Button>
        </form>
      </Form>
      <pre className="rounded bg-zinc-300 p-1 font-mono">
        Form: {JSON.stringify(form.watch(), null, 4)}
      </pre>
      <pre className="rounded bg-zinc-300 p-1 font-mono">
        formstate: {JSON.stringify(form.formState, null, 4)}
      </pre>
    </div>
  );
};
