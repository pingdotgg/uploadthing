---
"uploadthing": minor
"@uploadthing/shared": minor
---

feat: add ability to provide custom identifiers when uploading files

also adds ability for UTApi methods to filter based on custom identifiers

```ts
// bind custom id when uploading
f(["image"])
  .middleware(({ files }) => {
    const filesWithIds = files.map((f) => ({
        ...f,
        customId: uuid(),
    }))
    return { my: "metadata", [UTFiles]: filesWithIds };
  })

// filter based on custom id
const utapi = new UTApi();
utapi.getFileUrl("my-uuid", { keyType: "customId" });

// or, set a global keyType default
const utapi = new UTApi({ defaultKeyType: "customId" });
utapi.getFileUrl("my-uuid");
```