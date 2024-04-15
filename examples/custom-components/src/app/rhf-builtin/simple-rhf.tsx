"use client";

import { toast } from "sonner";
import { z } from "zod";

import { Button } from "~/components/ui/button";
import { Form, FormField, FormItem, useForm } from "~/components/ui/form";
import { UploadDropzone } from "~/uploadthing/client";
import { fileWithStateValidator } from "~/utils";

/**
 * A demo using RHF with built-in components from UT
 */
export const SimpleRHFDemo = () => {
  const form = useForm({
    schema: z.object({
      images: fileWithStateValidator.array(),
    }),
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
                <UploadDropzone
                  endpoint="imageUploader"
                  skipPolling
                  files={field.value}
                  onFilesChange={(files) => {
                    console.log("files", files);
                    return field.onChange(files);
                  }}
                />
              </FormItem>
            )}
          />

          <Button
            type="submit"
            className="w-full"
            disabled={!form.formState.isValid || !form.formState.isDirty}
          >
            Submit
          </Button>
        </form>
      </Form>
      <pre className="rounded bg-zinc-300 p-1 font-mono">
        Form: {JSON.stringify(form.watch(), null, 4)}
      </pre>
      <pre className="rounded bg-zinc-300 p-1 font-mono">
        Errors: {JSON.stringify(form.formState.errors, null, 4)}
      </pre>
    </div>
  );
};
