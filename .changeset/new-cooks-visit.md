---
"@uploadthing/react": major
"@uploadthing/solid": major
"uploadthing": major
---

feat!: allow client side metadata to be passed along with the files

## Summary

You can now pass input along with the files when uploading.

In your file route:

```ts
  withInput: f(["image"])
    .input(
      z.object({
        foo: z.string(),
      }),
    )
    .middleware((opts) => {
      console.log("input", opts.input);
      // input is typed as { foo: string }
      return {};
    })
    .onUploadComplete((data) => {
      console.log("upload completed", data);
    }),
```

Then, when uploading, attach the input to the component or the `startUpload`
function:

```tsx
const { useUploadThing } = generateReactHelpers<typeof OurFileRouter>();

function MyComponent() {
  // Vanilla way
  const { startUpload } = useUploadthing("withInput");
  async function onSubmit(files: File[]) {
    await startUpload(files, { foo: "bar" });
  }

  // Component way
  return (
    <UploadButton<OurFileRouter>
      endpoint="withInput"
      input={{ foo: "bar" }} // or use some state to be dynamic
    />
  );
}
```

The input is validated on **your** server and only leaves your server if you
pass it along from the `.middleware` to the `.onUploadComplete`. If you only use
the input in the middleware without returning it, the Uploadthing server won't
have any knowledge of it.

## Breaking changes

- Options passed in the `middleware` now comes as an object.

  ```ts
  // before
  route: f(["image"])
    // res only for Next.js pages
    .middleware((req, res) => {
      return {};
    });

  // after
  route: f(["image"])
    // res only for Next.js pages
    .middleware((opts) => {
      opts.req; // Request, NextRequest, NextApiRequest depending on runtime
      opts.res; // NextApiResponse for Next.js pages
      opts.input; // typesafe, validated input
      return {};
    });
  ```

- The `endpoint` option in the `useUploadthing` hook has been moved out to a
  separate positional argument.

  ```ts
  // before
  useUploadthing({
    endpoint: "withInput"
    onUploadComplete: ...
  })

  // after
  useUploadthing("withInput", {
    onUploadComplete: ...
  })
  ```

- The signature for `uploadFiles` has changed to object syntax.

  ```ts
  // before
  const { uploadFiles } = generateReactHelpers<OurFileRouter>();
  uploadFiles(files, endpoint, { url: "" })

  // after
  const { uploadFiles } = generateReactHelpers<OurFileRouter>();
  uploadFiles({
    files,
    endpoint,
    input, // <-- new option
    url,
  })
  ```
