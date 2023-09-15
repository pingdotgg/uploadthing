---
"@uploadthing/react": minor
---

fix: esm support by inhousing useDropzone code. You can now remove the `react-dropzone` 
dependency as it's no longer being used by UploadThing. If you're using a custom uploader
component, the hook can be imported from `@uploadthing/react/hooks`.