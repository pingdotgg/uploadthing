---
"uploadthing": minor
---

feat: accept `routeConfig` directly in `uploadthing/client.generateMimeTypes`

You no longer have to combine `generatePermittedFileTypes` and `generateMimeTypes`:

```diff
- accept={generateMimeTypes(
-   generatePermittedFileTypes(routeConfig).fileTypes,
- ).join(",")}
+ accept={generateMimeTypes(routeConfig ?? {}).join(",")}
```
