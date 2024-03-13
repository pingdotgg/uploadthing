---
"uploadthing": minor
---

feat: add client headers option

this primarily allows you to authenticate the client when your server is deployed separate from your client:

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
