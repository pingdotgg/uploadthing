---
"uploadthing": minor
"@uploadthing/react": minor
"@uploadthing/solid": minor
---

feat: add client headers option

this primarily allows you to authenticate the client when your server is deployed separate from your client:

### Vanilla client usage

```ts
import { genUploader } from "uploadthing/client";

const uploadFiles = genUploader<OurFileRouter>({
    url: "https://my-server.com",
});

uploadFiles("endpoint", {
    headers: async () => {
        const token = await getToken();
        return { Authorization: `Bearer ${token}` };
    },
});
```

### React (or Solid) usage

```tsx
// Using hook
const { startUpload } = useUploadThing("endpoint", {
    headers: async () => {
        const token = await getToken();
        return { Authorization: `Bearer ${token}` };
    },
});

// Using components
<UploadThing
  endpoint="endpoint"
  headers={async () => {
    const token = await getToken();
    return {
      Authorization: `Bearer ${token}`,
    };
  }}
/>
```

