---
"uploadthing": major
"@uploadthing/react": major
"@uploadthing/solid": major
---

feat: support arbitrary callback URLs (serving router from any endpoint). To use a different endpoint than `/api/uploadthing`,
you can pass the `url` parameter to `generateComponents` and `generateReactHelpers`/`generateSolidHelpers` (or pass it as a prop to the components if you're not generating them):

```ts
export const { UploadButton, UploadDropzone } = generateComponents({
  url: "/api/my-upload-endpoint" // if the host is unchanged from default (localhost or VERCEL_URL)
  // url: "https://my-custom-host.com" // if the host is different but path is /api/uploadthing
  // url: "https://my-custom-host.com/my-custom-endpoint" // fully custom url
})
```