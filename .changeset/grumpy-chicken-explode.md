---
"uploadthing": minor
"@uploadthing/react": minor
"@uploadthing/solid": minor
---

feat: support arbitrary callback URLs (serving router from any endpoint). To use a different endpoint than `/api/uploadthing`,
you must pass the `url` parameter to `generateComponents` and `generateReactHelpers`/`generateSolidHelpers` (or pass it as a prop to the components if you're not generating them):

```ts
export const { UploadButton, UploadDropzone } = generateComponents({
  url: "/api/my-upload-endpoint"
})
```