---
"@uploadthing/react": minor
"@uploadthing/solid": minor
---

feat: add client headers option

this primarily allows you to authenticate the client when your server is deployed separate from your client:

```tsx
import { useUploadThing, UploadButton } from "~/utils/uploadthing";

// Using hook
const { startUpload } = useUploadThing("endpoint", {
    headers: async () => {
        const token = await getToken();
        return { Authorization: `Bearer ${token}` };
    },
});

// Using components
<UploadButton
  endpoint="endpoint"
  headers={async () => {
    const token = await getToken();
    return {
      Authorization: `Bearer ${token}`,
    };
  }}
/>
```
