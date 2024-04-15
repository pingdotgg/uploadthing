"use client";

import * as React from "react";
import { toast } from "sonner";
import { z } from "zod";

import { FileUploader } from "~/components/file-uploader";
import { Button } from "~/components/ui/button";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
  useForm,
} from "~/components/ui/form";
import { fileWithStateValidator } from "~/utils";

export function ReactHookFormDemo() {
  const form = useForm({
    schema: z.object({
      images: fileWithStateValidator.array(),
    }),
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
    <Form {...form}>
      <form onSubmit={onSubmit} className="flex w-full flex-col gap-6">
        <FormField
          control={form.control}
          name="images"
          render={({ field }) => (
            <div className="space-y-6">
              <FormItem className="w-full">
                <FormLabel>Images</FormLabel>
                <FormControl>
                  <FileUploader
                    files={field.value}
                    onFilesChange={(files) => {
                      console.trace(files);
                      field.onChange(files);
                    }}
                  />
                </FormControl>
                <FormMessage />
              </FormItem>
            </div>
          )}
        />
        <Button className="w-fit" disabled={form.formState.isSubmitting}>
          Save
        </Button>
      </form>
      <pre className="rounded bg-zinc-300 p-1 font-mono">
        Form: {JSON.stringify(form.watch(), null, 4)}
      </pre>
      <pre className="rounded bg-zinc-300 p-1 font-mono">
        Errors: {JSON.stringify(form.formState.errors, null, 4)}
      </pre>
    </Form>
  );
}
