---
"uploadthing": minor
---

migrate utapi to a class which allows for (optional) custom initialization options to be
passed in. Below are shown the available options and their default values:

```ts
import { UTApi } from "uploadthing/server";

const utapi = new UTApi({
    fetch: globalThis.fetch,
    apiKey: process.env.UPLOADTHING_SECRET,
});

utapi.deleteFiles;
utapi.listFiles;
// ...
```

`utapi` is still exported from `uploadthing/server` for backwards compatibility, but will be removed in a future major release.