# @uploadthing/react

Learn more: [docs.uploadthing.com](https://docs.uploadthing.com)

## Examples

### Components V1

```tsx
// Name is temp
import { UploadButton } from "@uploadthing/react";

import type { FileRouter } from "./someUploadRouter";

export const SomePage = () => {
  return (
    <UploadButton<FileRouter>
      endpoint="someTypesafeEndpoint"
      onNewFileDropped={(file) => {
        console.log("new file added by user", file);
      }}
      onClientStartedUpload={(file) => {
        console.log("new file added by user", file);
      }}
      onClientFinishedUpload={(file) => {
        console.log(file);
      }}
    />
  );
};
```

### Components V2

```tsx
// Name is temp
import { UploadFileView, UploadProvider, UploadZone } from "@uploadthing/react";

import type { FileRouter } from "./someUploadRouter";

export const SomePage = () => {
  return (
    <UploadProvider<FileRouter>
      endpoint="someTypesafeEndpoint"
      onUpload={(file) => {
        console.log(file);
      }}
    >
      <div>Whatever You Want</div>
      <UploadZone>
        <div>Drop files here (you can style this yourself)</div>
      </UploadZone>
      <UploadFileView />
    </UploadProvider>
  );
};
```
