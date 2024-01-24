---
"uploadthing": minor
---

feat: forward incoming files to middleware function.

### Example usage

```ts
f({ ... })
  .middleware(({ files }) => {
    const uploadCount = files.length
    // ...
  })
```
