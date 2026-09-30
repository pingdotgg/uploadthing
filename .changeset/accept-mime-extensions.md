---
"@uploadthing/shared": patch
"@uploadthing/react": patch
"@uploadthing/vue": patch
"@uploadthing/solid": patch
"uploadthing": patch
---

Include file extensions alongside MIME types in client `accept` filters.

Some browsers and OSes (notably Chrome on Windows) ignore MIME-only `accept` values like `application/java-archive` and fall back to "All Files". `generateMimeTypes` and `generateClientDropzoneAccept` now also emit known extensions from `@uploadthing/mime-types` (for example `.jar`), so the native file picker can filter correctly.
