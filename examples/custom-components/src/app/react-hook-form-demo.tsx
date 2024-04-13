"use client";

import * as React from "react";
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

export function ReactHookFormDemo() {
  const form = useForm({
    schema: z.object({
      images: z.array(z.instanceof(File)),
    }),
  });

  const onSubmit = form.handleSubmit((input) => {});

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
                    onFilesChange={field.onChange}
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
    </Form>
  );
}
