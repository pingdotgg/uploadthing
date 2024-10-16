---
"uploadthing": minor
"@uploadthing/shared": minor
"@uploadthing/svelte": minor
"@uploadthing/react": minor
"@uploadthing/solid": minor
"@uploadthing/vue": minor
---

feat: add support to specify route endpoint that supports "Go to Definition"

All places that accepts the `endpoint` argument now additionally accepts a function that gets a route registry as input and returns the endpoint to use. This allows for "Go to Definition" to go to the backend route definition directly from the component.

### Examples  

```ts
// uploadthing/client#uploadFiles
uploadFiles(
    (rr) => rr.videoAndImage,
    { ... }
)

// uploadthing/react#useUploadThing
useUploadThing(
    (rr) => rr.videoAndImage,
    { ... }
)

// uploadthing/react#UploadButton
<UploadButton
    endpoint={(rr) => rr.videoAndImage}
    { ... }
/>
```