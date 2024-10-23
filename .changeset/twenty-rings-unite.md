---
"uploadthing": minor
"@uploadthing/shared": minor
"@uploadthing/svelte": minor
"@uploadthing/react": minor
"@uploadthing/solid": minor
"@uploadthing/vue": minor
---

feat: add support to specify route endpoint that supports "Go to Definition"

All places that accept the `endpoint` argument now additionally accept a function that gets a route registry as input and returns the endpoint to use. This allows for "Go to Definition" to go to the backend route definition directly from the component.

### Examples  

```ts
// uploadthing/client#uploadFiles
uploadFiles(
    (routeRegistry) => routeRegistry.videoAndImage,
    { ... }
)

// uploadthing/react#useUploadThing
useUploadThing(
    (routeRegistry) => routeRegistry.videoAndImage,
    { ... }
)

// uploadthing/react#UploadButton
<UploadButton
    endpoint={(routeRegistry) => routeRegistry.videoAndImage}
    { ... }
/>
```