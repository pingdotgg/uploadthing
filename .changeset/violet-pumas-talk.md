---
"uploadthing": patch
"@uploadthing/react": patch
"@uploadthing/solid": patch
---

fix: coherent file info in all methods

all methods now receives a similarly shaped object as the serverside `onUploadComplete` callback:

```ts
export type UploadFileResponse = {
  name: string;
  size: number;
  key: string;
  url: string;
};
```

Updated methods are:

- `onClientUploadComplete` in hooks as well as components (The old `fileName`, `fileSize`, `fileUrl` and `fileKey` are retained but marked as deprecated for backwards compatibility, and will be removed in the next major.)
- `utapi.uploadFiles` as well as `utapi.uploadFilesFromUrl`
